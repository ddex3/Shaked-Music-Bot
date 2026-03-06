import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface TrackData {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  requestedBy: string;
}

export type RepeatMode = "off" | "track" | "queue";

export interface GuildSettings {
  guild_id: string;
  volume: number;
  repeat_mode: RepeatMode;
  autoplay: number;
}

export interface PlaylistRow {
  id: number;
  guild_id: string;
  user_id: string;
  name: string;
}

export interface PlaylistTrackRow {
  id: number;
  playlist_id: number;
  title: string;
  url: string;
  duration: number;
}

export interface HistoryRow {
  id: number;
  guild_id: string;
  user_id: string;
  title: string;
  url: string;
  played_at: number;
}

export interface SearchResult {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
}
