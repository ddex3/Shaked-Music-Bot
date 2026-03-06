import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the queue"),

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
    const player = manager.get(interaction.guildId!);

    if (player.queue.isEmpty) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("The queue is already empty.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const count = player.queue.length;
    player.queue.clear();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Cleared **${count}** tracks from the queue.`),
      ],
    });
  },
};
