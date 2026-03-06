import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave the voice channel"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("You must be in a voice channel.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const manager = PlayerManager.getInstance();

    if (!manager.has(interaction.guildId!)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("I'm not in a voice channel.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    manager.remove(interaction.guildId!);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription("Disconnected from voice channel."),
      ],
    });
  },
};
