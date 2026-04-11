import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveConfig, configPath } from "../lib/config.js";

export interface LogoutOptions {
  yes?: boolean;
}

export async function logout(options: LogoutOptions = {}): Promise<void> {
  p.intro(accent().bg(pc.black(" dgrep logout ")));

  const config = await loadConfig();

  if (!config.claimedAt) {
    p.log.info("Not logged in. Nothing to do.");
    p.outro("Done.");
    return;
  }

  if (!options.yes) {
    const confirm = await p.confirm({
      message: "Log out? Your API key will be kept.",
    });
    if (!confirm || p.isCancel(confirm)) {
      p.outro("Cancelled.");
      return;
    }
  }

  await saveConfig({ apiKey: config.apiKey, cabinet: config.cabinet });
  p.log.success(`Logged out. API key kept in ${pc.dim(configPath())}`);
  p.outro("Run " + accent().fg("dgrep login") + " to link your account again.");
}
