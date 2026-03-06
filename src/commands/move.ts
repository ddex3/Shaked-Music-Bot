import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move a track in the queue")
    .addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("Current position (1-based)")
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("New position (1-based)")
        .setRequired(true)
        .setMinValue(1)
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

    const from = interaction.options.getInteger("from", true);
    const to = interaction.options.getInteger("to", true);
    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    const track = player.queue.getTrack(from - 1);
    const moved = player.queue.move(from - 1, to - 1);

    if (!moved || !track) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Invalid positions.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Moved **${track.title}** from position ${from} to ${to}.`),
      ],
    });
  },
};
