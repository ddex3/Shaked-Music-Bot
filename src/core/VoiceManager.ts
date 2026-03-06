import {
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";

export class VoiceManager {
  public async join(channel: VoiceBasedChannel): Promise<VoiceConnection> {
    const existing = getVoiceConnection(channel.guild.id);
    if (existing && existing.joinConfig.channelId === channel.id) {
      return existing;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      connection.destroy();
      throw new Error("Failed to join voice channel within 30 seconds.");
    }

    return connection;
  }

  public disconnect(guildId: string): void {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }
  }

  public getConnection(guildId: string): VoiceConnection | undefined {
    return getVoiceConnection(guildId);
  }
}
