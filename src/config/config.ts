import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const Config = {
  token: requireEnv("DISCORD_TOKEN"),
  clientId: requireEnv("DISCORD_CLIENT_ID"),
  geniusApiKey: process.env["GENIUS_API_KEY"] ?? "",
  dbPath: path.resolve(process.cwd(), "bot.db"),
  defaultVolume: 50,
  maxQueueSize: 500,
  maxPlaylistSize: 200,
  disconnectTimeout: 300_000,
  embedColor: 0x5865f2 as const,
  progressBarLength: 20,
} as const;
