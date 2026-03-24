import * as p from "@clack/prompts";
import pc from "picocolors";

export async function wizard(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" dgrep ")));

  p.log.step("Detecting your environment...");
  p.log.info("Wizard command not yet implemented.");

  p.outro(`Run ${pc.cyan("dgrep --help")} to see available commands.`);
}
