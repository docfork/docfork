import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import { findProjectRoot, loadProjectConfig, saveProjectConfig } from "../lib/project-config.js";

export interface RemoveOptions {
  yes?: boolean;
  cwd?: string;
}

export async function remove(library: string, options: RemoveOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const projectRoot = await findProjectRoot(cwd);

  if (!projectRoot) {
    p.log.error("No .dgrep/config.json found. Nothing to remove.");
    process.exitCode = 1;
    return;
  }

  const config = await loadProjectConfig(projectRoot);
  const libs = config?.libraries ?? [];

  const match = libs.find((l) => l.identifier === library || l.packages.includes(library));
  if (!match) {
    p.log.info(`${accent().fg(library)} is not tracked. Nothing to remove.`);
    return;
  }

  if (!options.yes) {
    const confirm = await p.confirm({
      message: `Remove ${match.identifier} from tracked libraries?`,
    });
    if (!confirm || p.isCancel(confirm)) {
      p.outro("Cancelled.");
      return;
    }
  }

  const updated = libs.filter((l) => l.identifier !== match.identifier);
  await saveProjectConfig(projectRoot, { ...config, libraries: updated });

  p.log.success(`Removed ${accent().fg(library)} from .dgrep/config.json`);
  console.log(`${updated.length} libraries remaining`);
}
