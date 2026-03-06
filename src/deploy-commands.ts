import { REST, Routes } from "discord.js";
import { Config } from "./config/config";
import { loadCommands, getCommands } from "./commands/registry";
import { printDeployHeader, printDeployProgress, printDeploySuccess, printDeployError } from "./utils/logger";

async function deploy(): Promise<void> {
  printDeployHeader();

  await loadCommands();
  const cmds = getCommands();
  const body = cmds.map((cmd) => cmd.data.toJSON());

  printDeployProgress(body.length);

  const rest = new REST({ version: "10" }).setToken(Config.token);

  await rest.put(Routes.applicationCommands(Config.clientId), { body });

  printDeploySuccess(body.length, "global");
}

deploy().catch((error) => {
  printDeployError(error);
  process.exit(1);
});
