import ffmpegStatic from "ffmpeg-static";
import pathMod from "path";
if (ffmpegStatic) {
  process.env["PATH"] = pathMod.dirname(ffmpegStatic) + pathMod.delimiter + (process.env["PATH"] ?? "");
}

import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  Events,
  VoiceState,
  MessageFlags,
} from "discord.js";
import { Config } from "./config/config";
import { initializeSchema } from "./database/schema";
import { closeDatabase } from "./database/connection";
import { PlayerManager } from "./core/PlayerManager";
import { loadCommands, getCommands } from "./commands/registry";
import { printStartup } from "./utils/logger";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  printStartup(readyClient as unknown as Client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  const cmds = getCommands();

  if (interaction.isAutocomplete()) {
    const command = cmds.get(interaction.commandName);
    if (command?.autocomplete) {
      await command.autocomplete(interaction).catch(() => {});
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = cmds.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(`Command error [${interaction.commandName}]:`, error);

    const errorMessage = "An error occurred while executing this command.";

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: errorMessage }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

client.on(Events.VoiceStateUpdate, (oldState: VoiceState, _newState: VoiceState) => {
  if (!oldState.channel) return;

  const members = oldState.channel.members.filter((m) => !m.user.bot);
  if (members.size === 0) {
    const botInChannel = oldState.channel.members.find(
      (m) => m.user.id === client.user?.id
    );

    if (botInChannel) {
      const manager = PlayerManager.getInstance();
      setTimeout(() => {
        const channel = oldState.channel;
        if (!channel) return;
        const currentMembers = channel.members.filter((m) => !m.user.bot);
        if (currentMembers.size === 0) {
          manager.remove(oldState.guild.id);
        }
      }, 30_000);
    }
  }
});

async function start(): Promise<void> {
  await initializeSchema();
  await loadCommands();
  await client.login(Config.token);
}

function shutdown(): void {
  console.log("Shutting down...");
  PlayerManager.getInstance().destroyAll();
  client.destroy();
  closeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown();
});

start().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
