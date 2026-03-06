import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { VoiceManager } from "../core/VoiceManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join your voice channel"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("You must be in a voice channel.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceManager = new VoiceManager();
    try {
      const connection = await voiceManager.join(voiceChannel);
      const manager = PlayerManager.getInstance();
      const player = manager.get(interaction.guildId!);
      player.setConnection(connection);
      player.textChannel = interaction.channel;

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Joined <#${voiceChannel.id}>`),
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Failed to join voice channel.")],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
