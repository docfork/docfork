/**
 * NDJSON + pretty output helpers for --json flag
 */

export interface JsonResult {
  type: "result";
  title: string;
  url: string;
  description: string;
  library: string;
}

export interface JsonError {
  type: "error";
  code: string;
  message: string;
}

export interface JsonMeta {
  type: "meta";
  query: string;
  libraries: string[];
  source?: string;
  count: number;
}

export interface JsonReadMeta {
  type: "read_meta";
  url: string;
  library: string;
  tokens: number;
  source: string;
}

export interface JsonReadContent {
  type: "content";
  text: string;
}

export type JsonOutput = JsonResult | JsonError | JsonMeta | JsonReadMeta | JsonReadContent;

export function jsonLine(obj: JsonOutput): void {
  console.log(JSON.stringify(obj));
}

export function jsonResults(
  query: string,
  library: string,
  results: Array<{ title: string; url: string; description: string }>
): void {
  jsonLine({ type: "meta", query, libraries: [library], count: results.length });
  for (const r of results) {
    jsonLine({ type: "result", title: r.title, url: r.url, description: r.description, library });
  }
}

export function jsonError(code: string, message: string): void {
  jsonLine({ type: "error", code, message });
}
