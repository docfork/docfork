import { accent } from "../lib/theme.js";
import pc from "picocolors";
import { findProjectRoot, loadProjectConfig } from "../lib/project-config.js";

export interface ListOptions {
  json?: boolean;
  cwd?: string;
}

export async function list(options: ListOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const projectRoot = await findProjectRoot(cwd);
  const config = projectRoot ? await loadProjectConfig(projectRoot) : null;
  const libs = config?.libraries ?? [];

  if (options.json) {
    for (const lib of libs) {
      console.log(JSON.stringify({ library: lib }));
    }
    return;
  }

  if (libs.length === 0) {
    console.log(
      `No tracked libraries. Run ${accent().fg("dgrep init")} or ${accent().fg("dgrep add <library>")}.`
    );
    return;
  }

  for (const lib of libs) {
    console.log(`  ${lib}`);
  }
  console.log(`\n${libs.length} libraries tracked in .dgrep/config.json`);
}
