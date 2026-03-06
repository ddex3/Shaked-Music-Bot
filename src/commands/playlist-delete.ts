import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlaylistService } from "../services/PlaylistService";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("playlist-delete")
    .setDescription("Delete a playlist")
    .addStringOption((option) =>
      option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true)
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
    const name = interaction.options.getString("name", true);
    const service = new PlaylistService();

    const result = await service.delete(
      interaction.guildId!,
      interaction.user.id,
      name
    );

    if (!result.success) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription(result.error!)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Deleted playlist **${name}**.`),
      ],
    });
  },
};
