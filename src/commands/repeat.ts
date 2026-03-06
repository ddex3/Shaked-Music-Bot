import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand, RepeatMode } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("repeat")
    .setDescription("Set repeat mode")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Repeat mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" }
        )
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

    const mode = interaction.options.getString("mode", true) as RepeatMode;
    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    player.repeatMode = mode;
    void player.saveSettings();

    const labels: Record<RepeatMode, string> = {
      off: "Off",
      track: "Track",
      queue: "Queue",
    };

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Repeat mode set to **${labels[mode]}**`),
      ],
    });
  },
};
