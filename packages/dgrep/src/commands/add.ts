import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveSource } from "../lib/providers.js";
import { addLibraryToProject, findProjectRoot } from "../lib/project-config.js";

export interface AddOptions {
  yes?: boolean;
  cwd?: string;
}

export async function add(library: string, options: AddOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(accent().bg(pc.black(" dgrep add ")));

  const source = resolveSource(library);
  p.log.step(`Resolved: ${accent().fg(library)} (${pc.dim(source.type)})`);

  if (!options.yes) {
    const confirm = await p.confirm({
      message: `Add ${library} to your tracked libraries?`,
    });
    if (!confirm || p.isCancel(confirm)) {
      p.outro("Cancelled.");
      return;
    }
  }

  const projectRoot = (await findProjectRoot(cwd)) ?? cwd;
  const added = await addLibraryToProject(projectRoot, library);

  if (added) {
    p.log.success(`Added ${accent().fg(library)} to .dgrep/config.json`);
  } else {
    p.log.info(`${accent().fg(library)} already tracked, skipping.`);
  }

  p.outro("Done.");
}
