import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { loadProjectConfig, saveProjectConfig } from "../lib/project-config.js";
import { detectProjectDeps } from "../lib/detect-deps.js";

export interface InitOptions {
  yes?: boolean;
  cwd?: string;
}

export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(pc.bgCyan(pc.black(" dgrep init ")));

  // -- Detect project -----------------------------------

  const detected = await detectProjectDeps(cwd);
  const configPath = join(detected.root, ".dgrep", "config.json");

  if (detected.isMonorepo) {
    p.log.step(`Project: ${pc.cyan(detected.root)} (monorepo, ${detected.packageCount} packages)`);
  } else {
    p.log.step(`Project: ${pc.cyan(detected.root)}`);
  }

  // Check if already initialized
  const existing = await loadProjectConfig(detected.root);
  if (existing?.libraries && existing.libraries.length > 0) {
    p.log.warning(
      `Already tracking ${existing.libraries.length} libraries: ${pc.cyan(existing.libraries.join(", "))}`
    );
    if (!options.yes) {
      const overwrite = await p.confirm({ message: "Overwrite?" });
      if (!overwrite || p.isCancel(overwrite)) {
        p.outro("Cancelled.");
        return;
      }
    }
  }

  // -- Show detected deps -----------------------------------

  const skipped = detected.totalBeforeFilter - detected.deps.length;

  if (detected.deps.length === 0) {
    p.log.info(
      skipped > 0
        ? `No library dependencies found (skipped ${skipped} build tools).`
        : "No dependencies detected."
    );
    await saveProjectConfig(detected.root, { libraries: [] });
    p.log.message(`  ${pc.dim("→")} ${configPath}`);
    p.outro(`Run ${pc.cyan("dgrep add <library>")} to track libraries.`);
    return;
  }

  p.log.step(
    `Detected ${pc.cyan(String(detected.deps.length))} dependencies` +
      (skipped > 0 ? ` ${pc.dim(`(skipped ${skipped} build tools)`)}` : "") +
      `:\n  ${pc.cyan(detected.deps.join(", "))}`
  );

  // -- Select -----------------------------------

  let selected: string[];

  if (options.yes) {
    selected = detected.deps;
  } else {
    const result = await p.multiselect({
      message: "Which libraries should dgrep track?",
      options: detected.deps.map((dep) => ({ value: dep, label: dep })),
      initialValues: detected.deps,
    });

    if (p.isCancel(result)) {
      p.outro("Cancelled.");
      return;
    }

    selected = result as string[];
  }

  const sorted = selected.sort();
  await saveProjectConfig(detected.root, { ...existing, libraries: sorted });

  p.log.success(`Tracking ${pc.cyan(String(sorted.length))} libraries`);
  p.log.message(`  ${pc.dim("→")} ${configPath}`);
  p.outro(`Run ${pc.cyan("dgrep search")} to search your stack.`);
}
