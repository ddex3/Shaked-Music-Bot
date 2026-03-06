import { execFile, spawn } from "child_process";
import path from "path";
import { SearchResult } from "../types";
import { Readable } from "stream";

const YT_DLP = path.resolve(__dirname, "..", "..", "bin", "yt-dlp.exe");

interface YtDlpVideoJson {
  title?: string;
  webpage_url?: string;
  original_url?: string;
  url?: string;
  duration?: number;
  thumbnail?: string;
  is_live?: boolean;
  entries?: YtDlpVideoJson[];
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(YT_DLP, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function parseVideoJson(data: YtDlpVideoJson): SearchResult {
  return {
    title: data.title ?? "Unknown",
    url: data.webpage_url ?? data.original_url ?? data.url ?? "",
    duration: Math.floor(data.duration ?? 0),
    thumbnail: data.thumbnail ?? "",
  };
}

export class YouTubeService {
  public async search(query: string): Promise<SearchResult | null> {
    try {
      const output = await runYtDlp([
        `ytsearch1:${query}`,
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--default-search", "ytsearch",
      ]);
      const data = JSON.parse(output) as YtDlpVideoJson;
      if (data.is_live) return null;
      return parseVideoJson(data);
    } catch {
      return null;
    }
  }

  public async searchMany(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const output = await runYtDlp([
        `ytsearch${limit}:${query}`,
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
      ]);
      const lines = output.split("\n").filter(Boolean);
      return lines.map((line) => parseVideoJson(JSON.parse(line) as YtDlpVideoJson));
    } catch {
      return [];
    }
  }

  public async getInfo(url: string): Promise<SearchResult | null> {
    try {
      const output = await runYtDlp([
        url,
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
      ]);
      const data = JSON.parse(output) as YtDlpVideoJson;
      return parseVideoJson(data);
    } catch {
      return null;
    }
  }

  public async getPlaylistTracks(url: string): Promise<SearchResult[]> {
    try {
      const output = await runYtDlp([
        url,
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
      ]);
      const lines = output.split("\n").filter(Boolean);
      return lines.map((line) => parseVideoJson(JSON.parse(line) as YtDlpVideoJson));
    } catch {
      return [];
    }
  }

  public getStream(url: string): Readable {
    const proc = spawn(YT_DLP, [
      url,
      "-f", "bestaudio[ext=webm]/bestaudio/best",
      "-o", "-",
      "--no-warnings",
      "--no-playlist",
      "--quiet",
    ], {
      env: { ...process.env, PYTHONUTF8: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.on("error", (err) => {
      console.error("yt-dlp spawn error:", err.message);
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg && !msg.includes("Broken pipe") && !msg.includes("Invalid argument"))
        console.error("yt-dlp stderr:", msg);
    });

    return proc.stdout as Readable;
  }

  public async getRelated(url: string): Promise<SearchResult | null> {
    try {
      const info = await this.getInfo(url);
      if (!info) return null;
      const results = await this.searchMany(info.title, 5);
      const filtered = results.filter((r) => r.url !== url && r.url !== info.url);
      if (filtered.length === 0) return null;
      return filtered[Math.floor(Math.random() * Math.min(filtered.length, 3))];
    } catch {
      return null;
    }
  }

  public isYouTubeUrl(input: string): boolean {
    return (
      input.includes("youtube.com/watch") ||
      input.includes("youtu.be/") ||
      input.includes("youtube.com/shorts/")
    );
  }

  public isPlaylistUrl(input: string): boolean {
    return input.includes("youtube.com/playlist") || input.includes("&list=");
  }

  public async isLiveStream(url: string): Promise<boolean> {
    try {
      const output = await runYtDlp([
        url,
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
      ]);
      const data = JSON.parse(output) as YtDlpVideoJson;
      return data.is_live === true;
    } catch {
      return false;
    }
  }

  public async resolve(
    input: string
  ): Promise<{ type: "track" | "playlist"; results: SearchResult[] }> {
    if (this.isPlaylistUrl(input)) {
      const tracks = await this.getPlaylistTracks(input);
      return { type: "playlist", results: tracks };
    }

    if (this.isYouTubeUrl(input)) {
      const info = await this.getInfo(input);
      return { type: "track", results: info ? [info] : [] };
    }

    const result = await this.search(input);
    return { type: "track", results: result ? [result] : [] };
  }
}
