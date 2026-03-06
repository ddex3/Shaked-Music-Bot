import { Collection } from "discord.js";
import { BotCommand } from "../types";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const commands = new Collection<string, BotCommand>();

export async function loadCommands(): Promise<void> {
  const commandsPath = path.join(__dirname);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && file !== "registry.ts" && file !== "registry.js");

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const module = await import(pathToFileURL(filePath).href) as { command: BotCommand };
    commands.set(module.command.data.name, module.command);
  }
}

export function getCommands(): Collection<string, BotCommand> {
  return commands;
}
