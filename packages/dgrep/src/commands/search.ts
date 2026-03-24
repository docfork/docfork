import * as p from "@clack/prompts";
import pc from "picocolors";

export async function search(query: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep search ")));

  p.log.info(`Search command not yet implemented. Query: ${pc.cyan(query)}`);

  p.outro("Done.");
}
