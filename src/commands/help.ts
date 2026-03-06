import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(Config.embedColor)
      .setTitle("Available Commands")
      .setDescription(
        [
          "**Music**",
          "`/play <query>` - Play a song (YouTube URL or search)",
          "`/pause` - Pause the current track",
          "`/resume` - Resume the paused track",
          "`/stop` - Stop playback and clear the queue",
          "`/skip` - Skip the current track",
          "`/previous` - Play the previous track",
          "`/now-playing` - Show the currently playing track",
          "`/queue [page]` - Show the current queue",
          "`/volume` - Open the volume control panel",
          "`/lyrics [query]` - Get lyrics for the current or specified track",
          "`/autoplay` - Toggle autoplay mode",
          "",
          "**Queue Management**",
          "`/shuffle` - Shuffle the queue",
          "`/clear` - Clear the queue",
          "`/remove <position>` - Remove a track from the queue",
          "`/move <from> <to>` - Move a track in the queue",
          "`/repeat <mode>` - Set repeat mode (off/track/queue)",
          "",
          "**Voice**",
          "`/join` - Join your voice channel",
          "`/leave` - Leave the voice channel",
          "",
          "**Playlists**",
          "`/playlist-create <name>` - Create a new playlist",
          "`/playlist-delete <name>` - Delete a playlist",
          "`/playlist-add <name> <query>` - Add a track to a playlist",
          "`/playlist-remove <name> <position>` - Remove a track from a playlist",
          "`/playlist-view <name>` - View tracks in a playlist",
          "`/playlist-play <name>` - Play a saved playlist",
        ].join("\n")
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
