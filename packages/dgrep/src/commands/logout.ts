import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveConfig, configPath } from "../lib/config.js";

export interface LogoutOptions {
  yes?: boolean;
}

export async function logout(options: LogoutOptions = {}): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep logout ")));

  const config = await loadConfig();

  if (!config.apiKey && !config.claimedAt) {
    p.log.info("Not logged in. Nothing to do.");
    p.outro("Done.");
    return;
  }

  if (!options.yes) {
    const confirm = await p.confirm({
      message: "Clear your API key and log out?",
    });
    if (!confirm || p.isCancel(confirm)) {
      p.outro("Cancelled.");
      return;
    }
  }

  await saveConfig({});
  p.log.success(`Credentials cleared from ${pc.dim(configPath())}`);
  p.outro("Logged out.");
}
