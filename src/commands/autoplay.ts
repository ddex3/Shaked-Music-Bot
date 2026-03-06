import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { VoiceManager } from "../core/VoiceManager";
import { YouTubeService } from "../services/YouTubeService";
import { Track } from "../core/Track";
import { Config } from "../config/config";

const RANDOM_QUERIES = [
  "top hits 2025", "pop hits", "rock classics", "hip hop hits",
  "chill vibes", "party music", "workout music", "summer hits",
  "throwback hits", "indie music", "electronic music", "r&b hits",
  "latin hits", "trending music", "best songs ever",
];

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Toggle autoplay mode"),

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

    const manager = PlayerManager.getInstance();
    const player = manager.get(interaction.guildId!);

    player.autoplay = !player.autoplay;
    void player.saveSettings();

    if (!player.autoplay) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription("Autoplay is now **disabled**"),
        ],
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription("Autoplay is now **enabled** - loading tracks..."),
      ],
    });

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

    player.textChannel = interaction.channel;

    if (player.currentTrack) {
      const added = await player.fillAutoplayQueue();
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Autoplay is now **enabled** - added **${added}** tracks to the queue.`),
        ],
      });
    } else {
      const youtube = new YouTubeService();
      const query = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
      const results = await youtube.searchMany(query, 10);

      if (results.length === 0) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Could not find any tracks.")],
        });
        return;
      }

      const tracks = results.map((r) => new Track({ ...r, requestedBy: "Autoplay" }));
      const first = tracks.shift()!;
      player.queue.addMany(tracks);
      void player.play(first);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setDescription(`Autoplay is now **enabled** - playing **${first.title}** + ${tracks.length} more in queue.`),
        ],
      });
    }
  },
};
