import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { VoiceManager } from "../core/VoiceManager";
import { YouTubeService } from "../services/YouTubeService";
import { Track } from "../core/Track";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option.setName("query").setDescription("YouTube URL or search query").setRequired(true)
    ),

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

    const query = interaction.options.getString("query", true);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(Config.embedColor).setDescription(`Searching for **${query}**...`)],
    });

    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    if (!player.voiceConnection) {
      const voiceManager = new VoiceManager();
      try {
        const connection = await voiceManager.join(voiceChannel);
        player.setConnection(connection);
      } catch {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Failed to join voice channel.")],
        });
        return;
      }
    }

    const youtube = new YouTubeService();

    if (youtube.isYouTubeUrl(query)) {
      const isLive = await youtube.isLiveStream(query);
      if (isLive) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Live streams are not supported.")],
        });
        return;
      }
    }

    let result;
    if (youtube.isYouTubeUrl(query)) {
      result = await youtube.getInfo(query);
    } else {
      result = await youtube.search(query);
    }

    if (!result) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("No results found.")],
      });
      return;
    }

    player.textChannel = interaction.channel;
    const track = new Track({
      ...result,
      requestedBy: interaction.user.id,
    });

    if (!player.currentTrack) {
      void player.play(track);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Playing **[${track.title}](${track.url})**`),
        ],
      });
    } else {
      player.queue.add(track);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Added to queue: **[${track.title}](${track.url})** (Position: ${player.queue.length})`),
        ],
      });
    }
  },
};
