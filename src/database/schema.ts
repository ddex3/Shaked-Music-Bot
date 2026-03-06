import { dbRun } from "./connection";

export async function initializeSchema(): Promise<void> {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      volume INTEGER DEFAULT 50,
      repeat_mode TEXT DEFAULT 'off',
      autoplay INTEGER DEFAULT 0
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      duration INTEGER NOT NULL,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      played_at INTEGER NOT NULL
    )
  `);

  await dbRun("CREATE INDEX IF NOT EXISTS idx_playlists_guild ON playlists(guild_id)");
  await dbRun("CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id)");
  await dbRun("CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id)");
  await dbRun("CREATE INDEX IF NOT EXISTS idx_history_guild ON history(guild_id)");
  await dbRun("CREATE INDEX IF NOT EXISTS idx_history_played ON history(played_at)");
}
