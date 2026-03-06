import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { BotCommand } from "../types";
import { PlaylistService } from "../services/PlaylistService";
import { Config } from "../config/config";

const PAGE_SIZE = 50;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildEmbed(
  name: string,
  tracks: { title: string; url: string; duration: number }[],
  page: number,
  totalPages: number
): EmbedBuilder {
  const start = page * PAGE_SIZE;
  const pageTracks = tracks.slice(start, start + PAGE_SIZE);

  const lines = pageTracks.map(
    (t, i) => `**${start + i + 1}.** [${t.title}](${t.url}) - ${formatDuration(t.duration)}`
  );

  const description = lines.join("\n");
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  return new EmbedBuilder()
    .setColor(Config.embedColor)
    .setTitle(`Playlist: ${name}`)
    .setDescription(description.length > 4096 ? description.substring(0, 4093) + "..." : description)
    .setFooter({
      text: `Page ${page + 1}/${totalPages} | ${tracks.length} tracks | Total: ${formatDuration(totalDuration)}`,
    });
}

function buildButtons(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("playlist_prev")
      .setEmoji("\u25C0")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId("playlist_next")
      .setEmoji("\u25B6")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("playlist-view")
    .setDescription("View tracks in a playlist")
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
    const name = interaction.options.getString("name", true);
    const service = new PlaylistService();
    const data = await service.getPlaylist(interaction.guildId!, name);

    if (!data) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("Playlist not found.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (data.tracks.length === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Config.embedColor)
            .setTitle(`Playlist: ${data.playlist.name}`)
            .setDescription("This playlist is empty."),
        ],
      });
      return;
    }

    const totalPages = Math.ceil(data.tracks.length / PAGE_SIZE);
    let page = 0;

    const embed = buildEmbed(data.playlist.name, data.tracks, page, totalPages);

    if (totalPages <= 1) {
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const reply = await interaction.reply({
      embeds: [embed],
      components: [buildButtons(page, totalPages)],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000,
    });

    collector.on("collect", async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        await btn.reply({ content: "Only the command user can navigate.", flags: MessageFlags.Ephemeral });
        return;
      }

      if (btn.customId === "playlist_prev") page = Math.max(0, page - 1);
      else if (btn.customId === "playlist_next") page = Math.min(totalPages - 1, page + 1);

      await btn.update({
        embeds: [buildEmbed(data.playlist.name, data.tracks, page, totalPages)],
        components: [buildButtons(page, totalPages)],
      });
    });

    collector.on("end", async () => {
      await reply.edit({ components: [] }).catch(() => {});
    });
  },
};
