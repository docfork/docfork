import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveAuth } from "../lib/auth.js";
import { searchDocs } from "../lib/api-client.js";
import type { SearchSection } from "../lib/api-client.js";
import { resolveLibraries } from "../lib/resolve-libraries.js";
import { addLibraryToProject, findProjectRoot } from "../lib/project-config.js";
import { jsonLine } from "../lib/output.js";
import type { JsonResult, JsonMeta } from "../lib/output.js";

export interface SearchOptions {
  libraries?: string[];
  json?: boolean;
  yes?: boolean;
  noSave?: boolean;
  apiKey?: string;
  cabinet?: string;
  cwd?: string;
}

interface MergedResult {
  section: SearchSection;
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
          `  ${pc.cyan(`dgrep search "${query}" --library react`)}\n` +
          `  ${pc.cyan("dgrep init")}`
      );
    }
    process.exitCode = 1;
    return;
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

    p.log.step(`Searching: ${pc.cyan(resolved.libraries.join(", "))}${pc.dim(sourceLabel)}`);
  }

  const results: MergedResult[] = [];
  const searchPromises = resolved.libraries.map(async (library) => {
    try {
      const response = await searchDocs(query, library, auth);
      return response.sections.map((section) => ({ section, library }));
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(searchPromises);
  for (const batch of allResults) {
    results.push(...batch);
  }

  // -- Output -----------------------------------

  if (options.json) {
    const meta: JsonMeta = {
      type: "meta",
      query,
      libraries: resolved.libraries,
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
      console.log(`\n${results.length} results across ${resolved.libraries.length} libraries`);
    }
  }

  // -- Remember pattern -----------------------------------

  if (resolved.source === "flag" && !options.noSave && options.libraries) {
    const projectRoot = (await findProjectRoot(cwd)) ?? cwd;

    if (options.yes) {
      for (const lib of options.libraries) {
        await addLibraryToProject(projectRoot, lib);
      }
      if (!options.json) {
        p.log.success(`Added ${pc.cyan(options.libraries.join(", "))} to .dgrep/config.json`);
      }
    } else if (!options.json) {
      const save = await p.confirm({
        message: `Remember ${options.libraries.join(", ")} for future searches?`,
      });
      if (save && !p.isCancel(save)) {
        for (const lib of options.libraries) {
          await addLibraryToProject(projectRoot, lib);
        }
        p.log.success(`Added ${pc.cyan(options.libraries.join(", "))} to .dgrep/config.json`);
      }
    }
  }
}
