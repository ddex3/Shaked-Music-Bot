import { GuildPlayer } from "./GuildPlayer";

export class PlayerManager {
  private static instance: PlayerManager;
  private players: Map<string, GuildPlayer> = new Map();

  private constructor() {}

  public static getInstance(): PlayerManager {
    if (!PlayerManager.instance) {
      PlayerManager.instance = new PlayerManager();
    }
    return PlayerManager.instance;
  }

  public get(guildId: string): GuildPlayer {
    let player = this.players.get(guildId);
    if (!player) {
      player = new GuildPlayer(guildId);
      this.players.set(guildId, player);
    }
    return player;
  }

  public has(guildId: string): boolean {
    return this.players.has(guildId);
  }

  public remove(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      player.destroy();
      this.players.delete(guildId);
    }
  }

  public destroyAll(): void {
    for (const [id, player] of this.players) {
      player.destroy();
      this.players.delete(id);
    }
  }

  public get size(): number {
    return this.players.size;
  }
}
