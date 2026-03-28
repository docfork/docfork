import * as p from "@clack/prompts";
import pc from "picocolors";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadProjectConfig, saveProjectConfig } from "../lib/project-config.js";

export interface InitOptions {
  yes?: boolean;
  cwd?: string;
}

export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(pc.bgCyan(pc.black(" dgrep init ")));

  // Check if already initialized
  const existing = await loadProjectConfig(cwd);
  if (existing?.libraries && existing.libraries.length > 0) {
    p.log.warning(
      `.dgrep/config.json already exists with ${existing.libraries.length} libraries: ${pc.cyan(existing.libraries.join(", "))}`
    );
    if (!options.yes) {
      const overwrite = await p.confirm({ message: "Overwrite?" });
      if (!overwrite || p.isCancel(overwrite)) {
        p.outro("Cancelled.");
        return;
      }
    }
  }

  // Detect from package.json
  const deps = await detectDeps(cwd);

  if (deps.length === 0) {
    p.log.info("No dependencies detected from package.json.");
    await saveProjectConfig(cwd, { libraries: [] });
    p.outro(
      `Created ${pc.cyan(".dgrep/config.json")} (empty). Run ${pc.cyan("dgrep add <library>")} to track libraries.`
    );
    return;
  }

  p.log.step(`Detected ${deps.length} dependencies: ${pc.cyan(deps.join(", "))}`);

  let selected: string[];

  if (options.yes) {
    selected = deps;
  } else {
    const result = await p.multiselect({
      message: "Which libraries should dgrep track?",
      options: deps.map((dep) => ({ value: dep, label: dep })),
      initialValues: deps,
    });

    if (p.isCancel(result)) {
      p.outro("Cancelled.");
      return;
    }

    selected = result as string[];
  }

  const sorted = selected.sort();
  await saveProjectConfig(cwd, { ...existing, libraries: sorted });

  p.log.success(`Tracking ${pc.cyan(String(sorted.length))} libraries in .dgrep/config.json`);
  p.outro(`Run ${pc.cyan("dgrep search")} to search your stack.`);
}

async function detectDeps(cwd: string): Promise<string[]> {
  try {
    const raw = await readFile(join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];

    return allDeps
      .filter(
        (dep) =>
          !dep.startsWith("@types/") &&
          !dep.startsWith("eslint") &&
          !dep.startsWith("prettier") &&
          ![
            "typescript",
            "vitest",
            "jest",
            "mocha",
            "msw",
            "obuild",
            "turbo",
            "concurrently",
          ].includes(dep)
      )
      .sort();
  } catch {
    return [];
  }
}
