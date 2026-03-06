import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setDescription("Play the previous track"),

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

    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    const prev = await player.previous();

    if (!prev) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("No previous track in history.")],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Playing previous: **[${prev.title}](${prev.url})**`),
      ],
    });
  },
};
