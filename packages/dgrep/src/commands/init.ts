import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { join } from "node:path";
import { loadProjectConfig, saveProjectConfig } from "../lib/project-config.js";
import type { ResolvedLibrary } from "../lib/project-config.js";
import { detectProjectDeps } from "../lib/detect-deps.js";
import { resolvePackages } from "../lib/api-client.js";
import { resolveAuth } from "../lib/auth.js";

export interface InitOptions {
  yes?: boolean;
  cwd?: string;
}

const LOGO_LINES = [
  "██████╗   ██████╗  ██████╗  ███████╗ ██████╗",
  "██╔══██╗ ██╔════╝  ██╔══██╗ ██╔════╝ ██╔══██╗",
  "██║  ██║ ██║  ███╗ ██████╔╝ █████╗   ██████╔╝",
  "██║  ██║ ██║   ██║ ██╔══██╗ ██╔══╝   ██╔═══╝",
  "██████╔╝ ╚██████╔╝ ██║  ██║ ███████╗ ██║",
  "╚═════╝   ╚═════╝  ╚═╝  ╚═╝ ╚══════╝ ╚═╝",
];

const GRADIENT = [
  "\x1b[38;2;255;120;1m",
  "\x1b[38;2;255;96;19m",
  "\x1b[38;2;255;72;37m",
  "\x1b[38;2;255;48;55m",
  "\x1b[38;2;255;24;74m",
  "\x1b[38;2;255;1;93m",
];
const RESET = "\x1b[0m";

export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  console.log();
  for (let i = 0; i < LOGO_LINES.length; i++) {
    console.log(`  ${GRADIENT[i]}${LOGO_LINES[i]}${RESET}`);
  }
  console.log(`  ${pc.dim("Docs search for AI agents by Docfork")}`);

  // -- Detect project -----------------------------------

  const detected = await detectProjectDeps(cwd);
  const configPath = join(detected.root, ".dgrep", "config.json");

  if (detected.isMonorepo) {
    p.log.step(
      `Project: ${accent().fg(detected.root)} (monorepo, ${detected.packageCount} packages)`
    );
  } else {
    p.log.step(`Project: ${accent().fg(detected.root)}`);
  }

  // Check if already initialized — merge mode
  const existing = await loadProjectConfig(detected.root);
  const existingIdentifiers = new Set(existing?.libraries?.map((l) => l.identifier) ?? []);

  // -- Show detected deps -----------------------------------

  const skipped = detected.totalBeforeFilter - detected.deps.length;

  if (detected.deps.length === 0) {
    if (existingIdentifiers.size > 0) {
      p.log.info(`Tracking ${existingIdentifiers.size} libraries. No new dependencies detected.`);
      p.outro(`Run ${accent().fg("dgrep add <library>")} to add more.`);
    } else {
      p.log.info(
        skipped > 0
          ? `No library dependencies found (skipped ${skipped} build tools).`
          : "No dependencies detected."
      );
      await saveProjectConfig(detected.root, { libraries: [] });
      p.log.message(`  ${pc.dim("→")} ${configPath}`);
      p.outro(`Run ${accent().fg("dgrep add <library>")} to track libraries.`);
    }
    return;
  }

  // filter out deps already tracked (by package name)
  const existingPackages = new Set(existing?.libraries?.flatMap((l) => l.packages) ?? []);
  const newDeps = detected.deps.filter((d) => !existingPackages.has(d));

  if (existingIdentifiers.size > 0) {
    p.log.info(`Already tracking ${existingIdentifiers.size} libraries`);
  }

  if (newDeps.length === 0 && existingIdentifiers.size > 0) {
    p.log.info("No new dependencies to add.");
    p.outro(`Run ${accent().fg("dgrep add <library>")} to add more.`);
    return;
  }

  const depsToShow = newDeps.length > 0 ? newDeps : detected.deps;
  const label =
    newDeps.length > 0 && existingIdentifiers.size > 0
      ? `${accent().fg(String(newDeps.length))} new dependencies`
      : `${accent().fg(String(depsToShow.length))} dependencies`;

  p.log.step(
    `Detected ${label}` +
      (skipped > 0 ? ` ${pc.dim(`(skipped ${skipped} build tools)`)}` : "") +
      `:\n  ${accent().fg(depsToShow.join(", "))}`
  );

  // -- Select -----------------------------------

  let selected: string[];

  if (options.yes) {
    selected = depsToShow;
  } else {
    const result = await p.multiselect({
      message:
        existingIdentifiers.size > 0
          ? "Which new libraries should dgrep track?"
          : "Which libraries should dgrep track?",
      options: depsToShow.map((dep) => ({ value: dep, label: dep })),
      initialValues: depsToShow,
    });

    if (p.isCancel(result)) {
      p.outro("Cancelled.");
      return;
    }

    selected = result as string[];
  }

  const sorted = selected.sort();

  // resolve npm names → Docfork identifiers
  const auth = await resolveAuth();
  // default: unresolved entries use package name as identifier fallback
  let resolvedLibraries: ResolvedLibrary[] = sorted.map((s) => ({
    identifier: s,
    packages: [s],
  }));

  try {
    const spinner = p.spinner();
    spinner.start("Resolving libraries against Docfork catalog...");
    const result = await resolvePackages(sorted, auth);
    spinner.stop("Resolution complete");

    if (result.resolved.length > 0) {
      // group resolved packages by identifier
      const grouped = new Map<string, string[]>();
      for (const r of result.resolved) {
        const pkgs = grouped.get(r.identifier) ?? [];
        pkgs.push(r.package);
        grouped.set(r.identifier, pkgs);
      }
      resolvedLibraries = [...grouped.entries()].map(([identifier, packages]) => ({
        identifier,
        packages: packages.sort(),
      }));

      for (const r of result.resolved) {
        p.log.message(`  ${pc.green("✓")} ${r.package} → ${accent().fg(r.identifier)}`);
      }
    }

    if (result.unresolved.length > 0) {
      const list = result.unresolved.join(", ");
      p.log.message(`  ${pc.yellow("✗")} ${pc.dim("not in catalog:")} ${list}`);
    }
  } catch {
    // resolve failed (no auth, network, etc.) — save raw npm names as fallback
    p.log.warning("Could not resolve against catalog. Saving raw package names.");
  }

  // merge with existing libraries (additive, never removes)
  const mergedLibraries = [...(existing?.libraries ?? [])];
  for (const lib of resolvedLibraries) {
    const existingLib = mergedLibraries.find((l) => l.identifier === lib.identifier);
    if (existingLib) {
      // merge packages into existing entry
      const allPkgs = new Set([...existingLib.packages, ...lib.packages]);
      existingLib.packages = [...allPkgs].sort();
    } else {
      mergedLibraries.push(lib);
    }
  }
  mergedLibraries.sort((a, b) => a.identifier.localeCompare(b.identifier));

  await saveProjectConfig(detected.root, { ...existing, libraries: mergedLibraries });

  const added = resolvedLibraries.filter((l) => !existingIdentifiers.has(l.identifier)).length;
  const total = mergedLibraries.length;
  const msg =
    added > 0 && existingIdentifiers.size > 0
      ? `Added ${added} new, tracking ${accent().fg(String(total))} libraries total`
      : `Tracking ${accent().fg(String(total))} libraries`;

  p.log.success(msg);
  p.log.message(`  ${pc.dim("→")} ${configPath}`);
  p.outro(`Run ${accent().fg("dgrep search")} to search your stack.`);
}
