import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
  GuildMember,
  MessageFlags,
} from "discord.js";
import { BotCommand } from "../types";
import { PlayerManager } from "../core/PlayerManager";
import { Config } from "../config/config";

function buildVolumeEmbed(volume: number): EmbedBuilder {
  const filled = Math.round(volume / 10);
  const empty = 10 - filled;
  const bar = `\u2588`.repeat(filled) + `\u2591`.repeat(empty);

  return new EmbedBuilder()
    .setColor(Config.embedColor)
    .setTitle("Volume Control")
    .setDescription(`[${bar}] **${volume}%**`);
}

function buildVolumeButtons(volume: number): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("vol_mute")
      .setLabel("Mute")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(volume === 0),
    new ButtonBuilder()
      .setCustomId("vol_down_10")
      .setLabel("-10")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(volume === 0),
    new ButtonBuilder()
      .setCustomId("vol_down_5")
      .setLabel("-5")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(volume === 0),
    new ButtonBuilder()
      .setCustomId("vol_up_5")
      .setLabel("+5")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(volume === 100),
    new ButtonBuilder()
      .setCustomId("vol_up_10")
      .setLabel("+10")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(volume === 100),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("vol_25")
      .setLabel("25%")
      .setStyle(volume === 25 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_50")
      .setLabel("50%")
      .setStyle(volume === 50 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_75")
      .setLabel("75%")
      .setStyle(volume === 75 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_100")
      .setLabel("100%")
      .setStyle(volume === 100 ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );

  return [row1, row2];
}

function handleVolumeButton(customId: string, currentVolume: number): number {
  switch (customId) {
    case "vol_mute": return 0;
    case "vol_down_10": return Math.max(0, currentVolume - 10);
    case "vol_down_5": return Math.max(0, currentVolume - 5);
    case "vol_up_5": return Math.min(100, currentVolume + 5);
    case "vol_up_10": return Math.min(100, currentVolume + 10);
    case "vol_25": return 25;
    case "vol_50": return 50;
    case "vol_75": return 75;
    case "vol_100": return 100;
    default: return currentVolume;
  }
}

export const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Open the volume control panel"),

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
    const volume = player.volume;

    const reply = await interaction.reply({
      embeds: [buildVolumeEmbed(volume)],
      components: buildVolumeButtons(volume),
      flags: MessageFlags.Ephemeral,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on("collect", async (btn: ButtonInteraction) => {
      const newVolume = handleVolumeButton(btn.customId, player.volume);
      player.setVolume(newVolume);

      await btn.update({
        embeds: [buildVolumeEmbed(newVolume)],
        components: buildVolumeButtons(newVolume),
      });
    });

    collector.on("end", async () => {
      await reply.edit({ components: [] }).catch(() => {});
    });
  },
};
