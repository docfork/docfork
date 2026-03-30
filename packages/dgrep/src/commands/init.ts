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

export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(accent().bg(pc.black(" dgrep init ")));

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

  // Check if already initialized
  const existing = await loadProjectConfig(detected.root);
  if (existing?.libraries && existing.libraries.length > 0) {
    p.log.warning(
      `Already tracking ${existing.libraries.length} libraries: ${accent().fg(existing.libraries.join(", "))}`
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
    p.outro(`Run ${accent().fg("dgrep add <library>")} to track libraries.`);
    return;
  }

  p.log.step(
    `Detected ${accent().fg(String(detected.deps.length))} dependencies` +
      (skipped > 0 ? ` ${pc.dim(`(skipped ${skipped} build tools)`)}` : "") +
      `:\n  ${accent().fg(detected.deps.join(", "))}`
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

  // resolve npm names → Docfork identifiers
  const auth = await resolveAuth();
  // default: unresolved entries use package name as identifier fallback
  let resolvedLibraries: ResolvedLibrary[] = sorted.map((s) => ({ package: s, identifier: s }));

  try {
    const spinner = p.spinner();
    spinner.start("Resolving libraries against Docfork catalog...");
    const result = await resolvePackages(sorted, auth);
    spinner.stop("Resolution complete");

    if (result.resolved.length > 0) {
      resolvedLibraries = result.resolved.map((r) => ({
        package: r.package,
        identifier: r.identifier,
      }));

      for (const r of result.resolved) {
        p.log.message(`  ${pc.green("✓")} ${r.package} → ${accent().fg(r.identifier)}`);
      }
    }

    if (result.unresolved.length > 0) {
      for (const u of result.unresolved) {
        p.log.message(`  ${pc.yellow("✗")} ${u} — ${pc.dim("not in catalog")}`);
      }
    }
  } catch {
    // resolve failed (no auth, network, etc.) — save raw npm names as fallback
    p.log.warning("Could not resolve against catalog. Saving raw package names.");
  }

  await saveProjectConfig(detected.root, { ...existing, libraries: resolvedLibraries });

  p.log.success(`Tracking ${accent().fg(String(resolvedLibraries.length))} libraries`);
  p.log.message(`  ${pc.dim("→")} ${configPath}`);
  p.outro(`Run ${accent().fg("dgrep search")} to search your stack.`);
}
