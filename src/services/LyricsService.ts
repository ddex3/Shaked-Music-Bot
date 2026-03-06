import { Config } from "../config/config";

export interface LyricsResult {
  title: string;
  lyrics: string;
}

interface LrcLibResult {
  trackName: string;
  artistName: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

interface GeniusSearchResponse {
  response: {
    hits: { result: { full_title: string; url: string } }[];
  };
}

export class LyricsService {
  public async search(query: string): Promise<LyricsResult | null> {
    const cleanedQuery = this.cleanQuery(query);

    const lrcResult = await this.searchLrcLib(cleanedQuery, query);
    if (lrcResult) return lrcResult;

    if (Config.geniusApiKey) {
      return this.searchGenius(cleanedQuery);
    }

    return null;
  }

  private cleanQuery(query: string): string {
    return query
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/official|video|music|audio|lyrics|hd|hq|4k/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private isMatch(query: string, trackName: string, artistName: string): boolean {
    const q = query.toLowerCase();
    const track = trackName.toLowerCase();
    const artist = artistName.toLowerCase();

    const parts = q.split(/\s*[-–—]\s*/);

    if (parts.length >= 2) {
      const songPart = parts.slice(1).join(" ").trim();
      const songWords = songPart.split(/\s+/).filter((w) => w.length > 1);
      return songWords.some((word) => track.includes(word));
    }

    const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
    const artistWords = artist.split(/\s+/);
    const nonArtistWords = queryWords.filter((w) => !artistWords.includes(w));

    if (nonArtistWords.length > 0) {
      return nonArtistWords.some((word) => track.includes(word));
    }

    return queryWords.some((word) => track.includes(word));
  }

  private async searchLrcLib(query: string, originalQuery: string): Promise<LyricsResult | null> {
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Shaked-Music-Bot/1.0" },
      });

      if (!response.ok) return null;

      const results = (await response.json()) as LrcLibResult[];
      if (results.length === 0) return null;

      const match = results.find((r) =>
        r.plainLyrics && this.isMatch(originalQuery, r.trackName, r.artistName)
      );

      if (!match || !match.plainLyrics) return null;

      let lyrics = match.plainLyrics;
      const title = `${match.artistName} - ${match.trackName}`;

      if (lyrics.length > 4000) {
        lyrics = lyrics.substring(0, 3997) + "...";
      }

      return { title, lyrics };
    } catch {
      return null;
    }
  }

  private async searchGenius(query: string): Promise<LyricsResult | null> {
    try {
      const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${Config.geniusApiKey}` },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as GeniusSearchResponse;
      if (data.response.hits.length === 0) return null;

      const hit = data.response.hits[0].result;
      const lyrics = await this.scrapeLyrics(hit.url);
      if (!lyrics) return null;

      return { title: hit.full_title, lyrics };
    } catch {
      return null;
    }
  }

  private async scrapeLyrics(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const html = await response.text();
      const lyricsMatch = html.match(
        /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g
      );

      if (!lyricsMatch) return null;

      let lyrics = lyricsMatch
        .map((m) => m.replace(/^data-lyrics-container="true"[^>]*>/, "").replace(/<\/div>$/, ""))
        .join("\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (lyrics.length > 4000) {
        lyrics = lyrics.substring(0, 3997) + "...";
      }

      return lyrics || null;
    } catch {
      return null;
    }
  }
}
