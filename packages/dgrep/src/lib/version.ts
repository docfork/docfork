import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// obuild may inline this module into dist/bin.mjs (__dirname = dist/) or emit
// it into dist/_chunks/ (__dirname = dist/_chunks/). Try both.
function readPackageVersion(): string {
  for (const candidate of [
    join(__dirname, "..", "package.json"),
    join(__dirname, "..", "..", "package.json"),
  ]) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, "utf-8")) as { version?: string };
      if (typeof pkg.version === "string") return pkg.version;
    } catch {
      // try next candidate
    }
  }
  return "0.0.0";
}

export const VERSION: string = readPackageVersion();
