import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { TextBasedChannel, EmbedBuilder } from "discord.js";
import { Queue } from "./Queue";
import { Track } from "./Track";
import { RepeatMode } from "../types";
import { Config } from "../config/config";
import { dbRun, dbGet } from "../database/connection";
import { GuildSettings } from "../types";
import { YouTubeService } from "../services/YouTubeService";
import { Readable } from "stream";

export class GuildPlayer {
  public readonly guildId: string;
  public readonly queue: Queue;
  public audioPlayer: AudioPlayer;
  public voiceConnection: VoiceConnection | null = null;
  public currentTrack: Track | null = null;
  public repeatMode: RepeatMode = "off";
  public autoplay = false;
  public volume = Config.defaultVolume;
  public textChannel: TextBasedChannel | null = null;

  private history: Track[] = [];
  private resource: AudioResource | null = null;
  private startedAt = 0;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private youtubeService: YouTubeService;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.queue = new Queue();
    this.youtubeService = new YouTubeService();

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      void this.handleTrackEnd();
    });

    this.audioPlayer.on("error", (error) => {
      console.error(`Audio player error in guild ${this.guildId}:`, error.message);
      void this.handleTrackEnd();
    });

    void this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const settings = await dbGet<GuildSettings>(
      "SELECT * FROM guild_settings WHERE guild_id = ?",
      [this.guildId]
    );
    if (settings) {
      this.volume = settings.volume;
      this.repeatMode = settings.repeat_mode as RepeatMode;
      this.autoplay = settings.autoplay === 1;
    }
  }

  public async saveSettings(): Promise<void> {
    await dbRun(
      `INSERT INTO guild_settings (guild_id, volume, repeat_mode, autoplay)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         volume = excluded.volume,
         repeat_mode = excluded.repeat_mode,
         autoplay = excluded.autoplay`,
      [this.guildId, this.volume, this.repeatMode, this.autoplay ? 1 : 0]
    );
  }

  public setConnection(connection: VoiceConnection): void {
    this.voiceConnection = connection;
    connection.subscribe(this.audioPlayer);

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      this.cleanup();
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      this.cleanup();
    });

    this.clearDisconnectTimer();
  }

  public async play(track: Track): Promise<void> {
    if (this.destroyed) return;

    this.currentTrack = track;
    this.startedAt = Date.now();

    try {
      const stream = this.youtubeService.getStream(track.url);
      this.resource = createAudioResource(stream as Readable, {
        inlineVolume: true,
      });
      this.resource.volume?.setVolume(this.volume / 100);
      this.audioPlayer.play(this.resource);

      await this.recordHistory(track);

      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(Config.embedColor)
          .setTitle("Now Playing")
          .setDescription(`[${track.title}](${track.url})`)
          .setThumbnail(track.thumbnail || null)
          .addFields(
            { name: "Duration", value: track.formatDuration(), inline: true },
            ...(track.requestedBy === "Autoplay"
              ? [{ name: "Requested By", value: "Autoplay", inline: true }]
              : [{ name: "Requested By", value: `<@${track.requestedBy}>`, inline: true }])
          );
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (error) {
      console.error(`Failed to play track: ${(error as Error).message}`);
      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(0xed4245)
          .setDescription(`Failed to play **${track.title}**. Skipping...`);
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
      void this.handleTrackEnd();
    }
  }

  private async handleTrackEnd(): Promise<void> {
    if (this.destroyed) return;

    if (this.currentTrack) {
      this.history.push(this.currentTrack);
      if (this.history.length > 50) {
        this.history.shift();
      }
    }

    if (this.repeatMode === "track" && this.currentTrack) {
      await this.play(this.currentTrack);
      return;
    }

    if (this.repeatMode === "queue" && this.currentTrack) {
      this.queue.add(this.currentTrack);
    }

    const next = this.queue.getNext();
    if (next) {
      if (this.autoplay && this.queue.length <= 2) {
        void this.fillAutoplayQueue();
      }
      await this.play(next);
      return;
    }

    if (this.autoplay && this.currentTrack) {
      try {
        const related = await this.youtubeService.getRelated(this.currentTrack.url);
        if (related) {
          const historyTitles = new Set(this.history.map((t) => t.title.toLowerCase()));
          if (!historyTitles.has(related.title.toLowerCase())) {
            const track = new Track({
              ...related,
              requestedBy: "Autoplay",
            });
            await this.play(track);
            return;
          }
        }
      } catch {
      }
    }

    this.currentTrack = null;
    this.resource = null;
    this.startDisconnectTimer();
  }

  public async fillAutoplayQueue(): Promise<number> {
    if (!this.currentTrack) return 0;

    try {
      const results = await this.youtubeService.searchMany(this.currentTrack.title, 10);
      const existingUrls = new Set([
        this.currentTrack.url,
        ...this.queue.getAll().map((t) => t.url),
        ...this.history.map((t) => t.url),
      ]);
      const existingTitles = new Set([
        this.currentTrack.title.toLowerCase(),
        ...this.queue.getAll().map((t) => t.title.toLowerCase()),
        ...this.history.map((t) => t.title.toLowerCase()),
      ]);
      const filtered = results.filter(
        (r) => !existingUrls.has(r.url) && !existingTitles.has(r.title.toLowerCase())
      );

      const tracks = filtered.map(
        (r) => new Track({ ...r, requestedBy: "Autoplay" })
      );
      return this.queue.addMany(tracks);
    } catch {
      return 0;
    }
  }

  public skip(): Track | null {
    const current = this.currentTrack;
    this.audioPlayer.stop(true);
    return current;
  }

  public async previous(): Promise<Track | null> {
    if (this.history.length === 0) return null;
    const prev = this.history.pop()!;
    if (this.currentTrack) {
      this.queue.addNext(this.currentTrack);
    }
    await this.play(prev);
    return prev;
  }

  public pause(): boolean {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
      return true;
    }
    return false;
  }

  public resume(): boolean {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
      return true;
    }
    return false;
  }

  public stop(): void {
    this.queue.clear();
    this.repeatMode = "off";
    this.currentTrack = null;
    this.audioPlayer.stop(true);
  }

  public setVolume(vol: number): void {
    this.volume = vol;
    if (this.resource?.volume) {
      this.resource.volume.setVolume(vol / 100);
    }
    void this.saveSettings();
  }

  public getPlaybackDuration(): number {
    if (!this.currentTrack || !this.startedAt) return 0;
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  public getProgressBar(): string {
    if (!this.currentTrack) return "";
    const duration = this.currentTrack.duration;
    const current = this.getPlaybackDuration();
    const progress = Math.min(current / duration, 1);
    const filled = Math.round(Config.progressBarLength * progress);
    const empty = Config.progressBarLength - filled;
    return `${"▓".repeat(filled)}${"░".repeat(empty)}`;
  }

  public isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
  }

  public isPaused(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
  }

  private async recordHistory(track: Track): Promise<void> {
    await dbRun(
      "INSERT INTO history (guild_id, user_id, title, url, played_at) VALUES (?, ?, ?, ?, ?)",
      [this.guildId, track.requestedBy, track.title, track.url, Date.now()]
    ).catch(() => {});
  }

  private startDisconnectTimer(): void {
    this.clearDisconnectTimer();
    this.disconnectTimer = setTimeout(() => {
      this.destroy();
    }, Config.disconnectTimeout);
  }

  private clearDisconnectTimer(): void {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }

  private cleanup(): void {
    this.currentTrack = null;
    this.resource = null;
    this.queue.clear();
    this.clearDisconnectTimer();
  }

  public destroy(): void {
    this.destroyed = true;
    this.cleanup();
    this.audioPlayer.stop(true);
    if (this.voiceConnection) {
      try {
        this.voiceConnection.destroy();
      } catch {
      }
      this.voiceConnection = null;
    }
  }
}
