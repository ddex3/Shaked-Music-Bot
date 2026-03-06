import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { LyricsService } from "../services/LyricsService";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Get lyrics for the current or specified track")
    .addStringOption((option) =>
      option.setName("query").setDescription("Song name to search for")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("You must be in a voice channel.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    let query = interaction.options.getString("query");

    if (!query) {
      const manager = PlayerManager.getInstance();
      const player = manager.get(interaction.guildId!);
      if (player.currentTrack) {
        query = player.currentTrack.title;
      }
    }

    if (!query) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setDescription("No track playing and no query provided."),
        ],
      });
      return;
    }

    const lyricsService = new LyricsService();
    const result = await lyricsService.search(query);

    if (!result) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setDescription(`No lyrics found for **${query}**.`),
        ],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Config.embedColor)
      .setTitle(result.title)
      .setDescription(result.lyrics);

    await interaction.editReply({ embeds: [embed] });
  },
};
