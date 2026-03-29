import * as p from "@clack/prompts";
import pc from "picocolors";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadProjectConfig, saveProjectConfig } from "../lib/project-config.js";
import { searchCatalog } from "../lib/api-client.js";
import { resolveAuth } from "../lib/auth.js";

export interface InitOptions {
  yes?: boolean;
  apiKey?: string;
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
  const rawDeps = await detectDeps(cwd);

  if (rawDeps.length === 0) {
    p.log.info("No dependencies detected from package.json.");
    await saveProjectConfig(cwd, { libraries: [] });
    p.outro(
      `Created ${pc.cyan(".dgrep/config.json")} (empty). Run ${pc.cyan("dgrep add <library>")} to track libraries.`
    );
    return;
  }

  // Resolve against Docfork catalog (remote)
  const spinner = p.spinner();
  spinner.start(`Checking ${rawDeps.length} dependencies against Docfork catalog...`);

  const auth = await resolveAuth(options.apiKey);
  const matched: Array<{ name: string; identifier: string }> = [];

  for (const dep of rawDeps) {
    try {
      const result = await searchCatalog(dep, auth);
      if (result.libraries.length > 0) {
        const best = result.libraries[0];
        matched.push({ name: dep, identifier: best.identifier });
      }
    } catch {
      // skip deps that fail lookup
    }
  }

  spinner.stop(
    `Found ${pc.cyan(String(matched.length))}/${rawDeps.length} dependencies in Docfork catalog.`
  );

  if (matched.length === 0) {
    p.log.info("No dependencies found in Docfork catalog.");
    await saveProjectConfig(cwd, { libraries: [] });
    p.outro(
      `Created ${pc.cyan(".dgrep/config.json")} (empty). Run ${pc.cyan("dgrep add <library>")} to track libraries.`
    );
    return;
  }

  let selected: Array<{ name: string; identifier: string }>;

  if (options.yes) {
    selected = matched;
  } else {
    const result = await p.multiselect({
      message: "Which libraries should dgrep track?",
      options: matched.map((m) => ({
        value: m.identifier,
        label: `${m.name} ${pc.dim(`→ ${m.identifier}`)}`,
      })),
      initialValues: matched.map((m) => m.identifier),
    });

    if (p.isCancel(result)) {
      p.outro("Cancelled.");
      return;
    }

    selected = matched.filter((m) => (result as string[]).includes(m.identifier));
  }

  const identifiers = selected.map((m) => m.identifier).sort();
  await saveProjectConfig(cwd, { ...existing, libraries: identifiers });

  for (const s of selected) {
    p.log.info(`${pc.cyan(s.name)} → ${s.identifier}`);
  }

  p.log.success(`Tracking ${pc.cyan(String(identifiers.length))} libraries in .dgrep/config.json`);
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
