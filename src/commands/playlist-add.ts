import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from "discord.js";
import { BotCommand } from "../types";
import { PlaylistService } from "../services/PlaylistService";
import { YouTubeService } from "../services/YouTubeService";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("playlist-add")
    .setDescription("Add a track to a playlist")
    .addStringOption((option) =>
      option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true)
    )
    .addStringOption((option) =>
      option.setName("query").setDescription("YouTube URL or search query").setRequired(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const service = new PlaylistService();
    const playlists = await service.listPlaylists(interaction.guildId!);
    const focused = interaction.options.getFocused().toLowerCase();
    const filtered = playlists
      .filter((p) => p.name.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(filtered.map((p) => ({ name: p.name, value: p.name })));
  },

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const name = interaction.options.getString("name", true);
    const query = interaction.options.getString("query", true);

    const youtube = new YouTubeService();
    const resolved = await youtube.resolve(query);

    if (resolved.results.length === 0) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("No results found.")],
      });
      return;
    }

    const service = new PlaylistService();
    const track = resolved.results[0];

    const result = await service.addTrack(
      interaction.guildId!,
      name,
      track.title,
      track.url,
      track.duration
    );

    if (!result.success) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription(result.error!)],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Added **${track.title}** to playlist **${name}**.`),
      ],
    });
  },
};
