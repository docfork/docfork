import * as p from "@clack/prompts";
import { resolveAuth } from "../lib/auth.js";
import { readUrl } from "../lib/api-client.js";
import { jsonLine } from "../lib/output.js";
import { findProjectRoot } from "../lib/project-config.js";
import { incrementReads } from "../lib/stats.js";

export interface ReadOptions {
  json?: boolean;
  tokens?: number;
  apiKey?: string;
  cabinet?: string;
}

export async function read(rawUrl: string, options: ReadOptions = {}): Promise<void> {
  // normalize: prepend https:// if no protocol
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    new URL(url);
  } catch {
    p.log.error(
      `Invalid URL: ${rawUrl}\n  Expected a documentation URL, e.g.:\n  dgrep read https://react.dev/reference/react/useState`
    );
    process.exitCode = 1;
    return;
  }

  const auth = await resolveAuth(options.apiKey);

  if (options.cabinet) {
    auth.cabinet = options.cabinet;
  }

  let result;
  try {
    result = await readUrl(url, auth, options.tokens);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      jsonLine({ type: "error", code: "read_failed", message });
    } else {
      p.log.error(`Could not read: ${url}\n  ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  if (options.json) {
    jsonLine({
      type: "read_meta",
      url,
      library: result.library_identifier,
      tokens: Math.ceil(result.text.length / 3.75),
      source: result.version_info === "live" ? "live" : "indexed",
    });
    jsonLine({ type: "content", text: result.text });
  } else {
    console.log(result.text);
    p.log.info(
      `${result.library_identifier}` + (result.version_info ? ` (${result.version_info})` : "")
    );
  }

  // stats tracking (fire-and-forget)
  const projectRoot = (await findProjectRoot(process.cwd())) ?? process.cwd();
  incrementReads(projectRoot, result.library_identifier).catch(() => {});
}
