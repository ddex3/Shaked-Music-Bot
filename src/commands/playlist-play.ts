import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { VoiceManager } from "../core/VoiceManager";
import { PlaylistService } from "../services/PlaylistService";
import { Track } from "../core/Track";
import { Config } from "../config/config";

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("playlist-play")
    .setDescription("Play a saved playlist")
    .addStringOption((option) =>
      option.setName("name").setDescription("Playlist name").setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const service = new PlaylistService();
    const playlists = await service.listPlaylists(interaction.guildId!);
    const focused = interaction.options.getFocused().toLowerCase();
    const filtered = playlists
      .filter((p) => p.name.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(filtered.map((p) => ({ name: p.name, value: p.name })));
  },

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

    const name = interaction.options.getString("name", true);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(Config.embedColor).setDescription(`Loading playlist **${name}**...`)],
    });

    const service = new PlaylistService();
    const data = await service.getPlaylist(interaction.guildId!, name);

    if (!data) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Playlist not found.")],
      });
      return;
    }

    if (data.tracks.length === 0) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Playlist is empty.")],
      });
      return;
    }

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

    player.textChannel = interaction.channel;

    const tracks = data.tracks.map(
      (t) =>
        new Track({
          title: t.title,
          url: t.url,
          duration: t.duration,
          thumbnail: "",
          requestedBy: interaction.user.id,
        })
    );

    const added = player.queue.addMany(tracks);

    if (!player.currentTrack) {
      const first = player.queue.getNext();
      if (first) {
        void player.play(first);
      }
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Config.embedColor)
          .setDescription(`Added **${added}** tracks from **${data.playlist.name}** to the queue.`),
      ],
    });
  },
};
