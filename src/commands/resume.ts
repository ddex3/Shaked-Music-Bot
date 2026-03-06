import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume the paused track"),

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

    if (!player.currentTrack) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Nothing is playing.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (player.resume()) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Resumed **${player.currentTrack.title}**`),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Track is not paused.")],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
