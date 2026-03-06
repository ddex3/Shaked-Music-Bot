import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlaylistService } from "../services/PlaylistService";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("playlist-create")
    .setDescription("Create a new playlist")
    .addStringOption((option) =>
      option.setName("name").setDescription("Playlist name").setRequired(true).setMaxLength(100)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString("name", true);
    const service = new PlaylistService();

    const result = await service.create(
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
          .setDescription(`Created playlist **${name}**.`),
      ],
    });
  },
};
