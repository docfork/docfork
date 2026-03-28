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

  p.intro(pc.bgCyan(pc.black(" dgrep add ")));

  const source = resolveSource(library);
  p.log.step(`Resolved: ${pc.cyan(library)} (${pc.dim(source.type)})`);

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
    p.log.success(`Added ${pc.cyan(library)} to .dgrep/config.json`);
    console.log(`library: ${library}`);
    console.log(`identifier: ${source.identifier}`);
    console.log(`source: ${source.type}`);
  } else {
    p.log.info(`${pc.cyan(library)} already tracked, skipping.`);
  }

  p.outro("Done.");
}
