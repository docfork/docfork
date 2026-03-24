import * as p from "@clack/prompts";
import pc from "picocolors";

export async function init(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep init ")));

  p.log.info("Init command not yet implemented.");

  p.outro("Done.");
}
