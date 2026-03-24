import * as p from "@clack/prompts";
import pc from "picocolors";

export async function add(library: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep add ")));

  p.log.info(`Add command not yet implemented. Library: ${pc.cyan(library)}`);

  p.outro("Done.");
}
