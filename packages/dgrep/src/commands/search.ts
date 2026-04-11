import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveAuth } from "../lib/auth.js";
import { batchSearchDocs } from "../lib/api-client.js";
import { resolveLibraries } from "../lib/resolve-libraries.js";
import { addLibraryToProject, findProjectRoot } from "../lib/project-config.js";
import { jsonLine } from "../lib/output.js";
import type { JsonResult, JsonMeta } from "../lib/output.js";
import { incrementSearches } from "../lib/stats.js";

export interface SearchOptions {
  libraries?: string[];
  limit?: number;
  json?: boolean;
  yes?: boolean;
  noSave?: boolean;
  apiKey?: string;
  cabinet?: string;
  cwd?: string;
}

interface MergedResult {
  section: { title: string; url: string; description: string };
  library: string;
}

export async function search(query: string, options: SearchOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const auth = await resolveAuth(options.apiKey);

  if (options.cabinet) {
    auth.cabinet = options.cabinet;
  }

  // -- Resolve libraries -----------------------------------

  const resolved = await resolveLibraries({ libraries: options.libraries, cwd });

  if (resolved.libraries.length === 0) {
    if (options.json) {
      jsonLine({ type: "error", code: "no_libraries", message: "No libraries found." });
    } else {
      p.log.error(
        `No libraries found. Specify a library or initialize your project.\n` +
          `  ${accent().fg(`dgrep search "${query}" --library react`)}\n` +
          `  ${accent().fg("dgrep init")}`
      );
    }
    process.exitCode = 1;
    return;
  }

  // -- Prune libraries (API max 20) -----------------------------------

  const MAX_LIBRARIES = 20;
  let searchLibraries = [...new Set(resolved.libraries)];

  if (searchLibraries.length > MAX_LIBRARIES) {
    const skipped = searchLibraries.length - MAX_LIBRARIES;
    searchLibraries = searchLibraries.slice(0, MAX_LIBRARIES);
    process.stderr.write(
      `Searching ${MAX_LIBRARIES}/${resolved.libraries.length} libraries (${skipped} skipped). Use --library to override.\n`
    );
  }

  // -- Search in parallel -----------------------------------

  if (!options.json) {
    const sourceLabel =
      resolved.source === "flag"
        ? ""
        : resolved.source === "project"
          ? " (from .dgrep/config.json)"
          : resolved.source === "detected"
            ? " (detected from package.json)"
            : " (catalog)";

    p.log.step(`Searching: ${accent().fg(searchLibraries.join(", "))}${pc.dim(sourceLabel)}`);
  }

  const results: MergedResult[] = [];
  const limit = options.limit ?? 10;

  const specifiers = searchLibraries.map((lib) => (lib.includes("@") ? lib : `${lib}@latest`));
  const batchResponse = await batchSearchDocs(query, specifiers, auth, limit);

  for (const r of batchResponse.results ?? []) {
    results.push({
      section: { title: r.title, url: r.url, description: r.content?.slice(0, 200) ?? "" },
      library: r.library,
    });
  }

  // -- Output -----------------------------------

  const uniqueLibraries = new Set(results.map((r) => r.library));

  if (options.json) {
    const meta: JsonMeta = {
      type: "meta",
      query,
      libraries: searchLibraries,
      source: resolved.source,
      count: results.length,
    };
    jsonLine(meta);

    for (const r of results) {
      const line: JsonResult = {
        type: "result",
        title: r.section.title,
        url: r.section.url,
        description: r.section.description,
        library: r.library,
      };
      jsonLine(line);
    }

    // stderr summary for agents (visible even when stdout is redirected)
    process.stderr.write(
      `Found ${results.length} results across ${uniqueLibraries.size} libraries\n`
    );
  } else {
    if (results.length === 0) {
      p.log.warning("No results found.");
    } else {
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(
          `\n${pc.bold(`[${i + 1}]`)} ${pc.bold(r.section.title)} — ${r.section.description}\n` +
            `    ${pc.dim(r.library)} · ${pc.underline(r.section.url)}`
        );
      }
      console.log(`\n${results.length} of ${results.length} results. Use --limit for more.`);
    }
  }

  // -- Stats tracking (fire-and-forget) -----------------------------------

  const projectRoot = (await findProjectRoot(cwd)) ?? cwd;
  if (results.length > 0) {
    incrementSearches(projectRoot, searchLibraries).catch(() => {});
  }

  // -- Remember pattern -----------------------------------

  if (resolved.source === "flag" && !options.noSave && options.libraries) {
    const libsToSave = [...new Set(options.libraries)];
    if (options.yes) {
      for (const lib of libsToSave) {
        await addLibraryToProject(projectRoot, lib);
      }
      if (!options.json) {
        p.log.success(`Added ${accent().fg(libsToSave.join(", "))} to .dgrep/config.json`);
      }
    } else if (!options.json) {
      const save = await p.confirm({
        message: `Remember ${libsToSave.join(", ")} for future searches?`,
      });
      if (save && !p.isCancel(save)) {
        for (const lib of libsToSave) {
          await addLibraryToProject(projectRoot, lib);
        }
        p.log.success(`Added ${accent().fg(libsToSave.join(", "))} to .dgrep/config.json`);
      }
    }
  }
}
