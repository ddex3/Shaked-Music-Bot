import { dbRun, dbGet, dbAll } from "../database/connection";
import { PlaylistRow, PlaylistTrackRow } from "../types";
import { Config } from "../config/config";

export class PlaylistService {
  public async create(
    guildId: string,
    userId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await dbGet<PlaylistRow>(
      "SELECT id FROM playlists WHERE guild_id = ? AND name = ? COLLATE NOCASE",
      [guildId, name]
    );

    if (existing) {
      return { success: false, error: "A playlist with that name already exists." };
    }

    await dbRun(
      "INSERT INTO playlists (guild_id, user_id, name) VALUES (?, ?, ?)",
      [guildId, userId, name]
    );

    return { success: true };
  }

  public async delete(
    guildId: string,
    userId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    const playlist = await dbGet<PlaylistRow>(
      "SELECT * FROM playlists WHERE guild_id = ? AND name = ? COLLATE NOCASE",
      [guildId, name]
    );

    if (!playlist) {
      return { success: false, error: "Playlist not found." };
    }

    if (playlist.user_id !== userId) {
      return { success: false, error: "You can only delete your own playlists." };
    }

    await dbRun("DELETE FROM playlists WHERE id = ?", [playlist.id]);
    return { success: true };
  }

  public async addTrack(
    guildId: string,
    name: string,
    title: string,
    url: string,
    duration: number
  ): Promise<{ success: boolean; error?: string }> {
    const playlist = await dbGet<PlaylistRow>(
      "SELECT * FROM playlists WHERE guild_id = ? AND name = ? COLLATE NOCASE",
      [guildId, name]
    );

    if (!playlist) {
      return { success: false, error: "Playlist not found." };
    }

    const count = await dbGet<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM playlist_tracks WHERE playlist_id = ?",
      [playlist.id]
    );

    if (count && count.cnt >= Config.maxPlaylistSize) {
      return { success: false, error: `Playlist is full (max ${Config.maxPlaylistSize} tracks).` };
    }

    await dbRun(
      "INSERT INTO playlist_tracks (playlist_id, title, url, duration) VALUES (?, ?, ?, ?)",
      [playlist.id, title, url, duration]
    );

    return { success: true };
  }

  public async removeTrack(
    guildId: string,
    name: string,
    position: number
  ): Promise<{ success: boolean; error?: string; title?: string }> {
    const playlist = await dbGet<PlaylistRow>(
      "SELECT * FROM playlists WHERE guild_id = ? AND name = ? COLLATE NOCASE",
      [guildId, name]
    );

    if (!playlist) {
      return { success: false, error: "Playlist not found." };
    }

    const tracks = await dbAll<PlaylistTrackRow>(
      "SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY id",
      [playlist.id]
    );

    if (position < 1 || position > tracks.length) {
      return { success: false, error: `Invalid position. Playlist has ${tracks.length} tracks.` };
    }

    const track = tracks[position - 1];
    await dbRun("DELETE FROM playlist_tracks WHERE id = ?", [track.id]);
    return { success: true, title: track.title };
  }

  public async getPlaylist(
    guildId: string,
    name: string
  ): Promise<{ playlist: PlaylistRow; tracks: PlaylistTrackRow[] } | null> {
    const playlist = await dbGet<PlaylistRow>(
      "SELECT * FROM playlists WHERE guild_id = ? AND name = ? COLLATE NOCASE",
      [guildId, name]
    );

    if (!playlist) return null;

    const tracks = await dbAll<PlaylistTrackRow>(
      "SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY id",
      [playlist.id]
    );

    return { playlist, tracks };
  }

  public async listPlaylists(guildId: string): Promise<PlaylistRow[]> {
    return dbAll<PlaylistRow>(
      "SELECT * FROM playlists WHERE guild_id = ? ORDER BY name",
      [guildId]
    );
  }
}
