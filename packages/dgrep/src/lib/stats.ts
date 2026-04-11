import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const STATS_FILE = "stats.json";
const CONFIG_DIR = ".dgrep";

export interface LibraryStats {
  searches: number;
  reads: number;
  last_searched?: string;
}

export type StatsFile = Record<string, LibraryStats>;

export async function loadStats(projectRoot: string): Promise<StatsFile> {
  try {
    const raw = await readFile(join(projectRoot, CONFIG_DIR, STATS_FILE), "utf-8");
    return JSON.parse(raw) as StatsFile;
  } catch {
    return {};
  }
}

async function saveStats(projectRoot: string, stats: StatsFile): Promise<void> {
  const dir = join(projectRoot, CONFIG_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, STATS_FILE), JSON.stringify(stats, null, 2) + "\n");
}

export async function incrementSearches(projectRoot: string, libraries: string[]): Promise<void> {
  try {
    const stats = await loadStats(projectRoot);
    const now = new Date().toISOString().slice(0, 10);
    for (const lib of libraries) {
      const entry = stats[lib] ?? { searches: 0, reads: 0 };
      entry.searches += 1;
      entry.last_searched = now;
      stats[lib] = entry;
    }
    await saveStats(projectRoot, stats);
  } catch {
    // silent failure — don't break search for stats
  }
}

export async function incrementReads(projectRoot: string, library: string): Promise<void> {
  try {
    const stats = await loadStats(projectRoot);
    const entry = stats[library] ?? { searches: 0, reads: 0 };
    entry.reads += 1;
    stats[library] = entry;
    await saveStats(projectRoot, stats);
  } catch {
    // silent failure — don't break read for stats
  }
}
