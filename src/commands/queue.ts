import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue")
    .addIntegerOption((option) =>
      option.setName("page").setDescription("Page number").setMinValue(1)
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

    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    if (!player.currentTrack && player.queue.isEmpty) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("The queue is empty.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const pageSize = 10;
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const tracks = player.queue.getAll();
    const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
    const currentPage = Math.min(page, totalPages - 1);
    const start = currentPage * pageSize;
    const pageTracks = tracks.slice(start, start + pageSize);

    const embed = new EmbedBuilder().setColor(Config.embedColor).setTitle("Queue");

    const lines: string[] = [];

    if (player.currentTrack) {
      lines.push(`**Now Playing:** [${player.currentTrack.title}](${player.currentTrack.url}) - ${player.currentTrack.formatDuration()}\n`);
    }

    if (pageTracks.length > 0) {
      lines.push("**Up Next:**");
      for (let i = 0; i < pageTracks.length; i++) {
        const t = pageTracks[i];
        lines.push(`**${start + i + 1}.** [${t.title}](${t.url}) - ${t.formatDuration()}`);
      }
    }

    const description = lines.join("\n");
    embed.setDescription(description.length > 4096 ? description.substring(0, 4093) + "..." : description);

    embed.setFooter({
      text: `Page ${currentPage + 1}/${totalPages} | ${tracks.length} tracks | Repeat: ${player.repeatMode}`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
