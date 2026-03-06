import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";
import { Track } from "../core/Track";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number): string => n.toString().padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("now-playing")
    .setDescription("Show the currently playing track"),

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

    const track: Track = player.currentTrack;
    const elapsed = player.getPlaybackDuration();
    const progressBar = player.getProgressBar();
    const status = player.isPaused() ? "Paused" : "Playing";

    const embed = new EmbedBuilder()
      .setColor(Config.embedColor)
      .setTitle("Now Playing")
      .setDescription(`[${track.title}](${track.url})`)
      .setThumbnail(track.thumbnail)
      .addFields(
        {
          name: "Progress",
          value: `${progressBar}\n${formatTime(elapsed)} / ${track.formatDuration()}`,
        },
        { name: "Status", value: status, inline: true },
        { name: "Volume", value: `${player.volume}%`, inline: true },
        { name: "Repeat", value: player.repeatMode, inline: true },
        { name: "Requested By", value: `<@${track.requestedBy}>`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
