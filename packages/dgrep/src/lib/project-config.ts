import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";

export interface ResolvedLibrary {
  package: string;
  identifier: string;
}

export interface ProjectConfig {
  libraries?: ResolvedLibrary[];
  cabinet?: string;
}

/** extract searchable identifiers from config */
export function getLibraryIdentifiers(config: ProjectConfig): string[] {
  if (!config.libraries) return [];
  return config.libraries.map((lib) => lib.identifier);
}

/** extract raw package names from config */
export function getPackageNames(config: ProjectConfig): string[] {
  if (!config.libraries) return [];
  return config.libraries.map((lib) => lib.package);
}

const CONFIG_DIR = ".dgrep";
const CONFIG_FILE = "config.json";

export async function findProjectRoot(startDir: string): Promise<string | null> {
  let dir = startDir;
  const root = dirname(dir) === dir ? dir : undefined;

  while (true) {
    // Check for .dgrep/ directory
    try {
      await access(join(dir, CONFIG_DIR), constants.F_OK);
      return dir;
    } catch {
      // not found, continue
    }

    // Check for package.json as fallback root marker
    try {
      await access(join(dir, "package.json"), constants.F_OK);
      return dir;
    } catch {
      // not found, continue
    }

    const parent = dirname(dir);
    if (parent === dir || parent === root) return null;
    dir = parent;
  }
}

export async function loadProjectConfig(projectRoot: string): Promise<ProjectConfig | null> {
  try {
    const raw = await readFile(join(projectRoot, CONFIG_DIR, CONFIG_FILE), "utf-8");
    return JSON.parse(raw) as ProjectConfig;
  } catch {
    return null;
  }
}

export async function saveProjectConfig(projectRoot: string, config: ProjectConfig): Promise<void> {
  const dir = join(projectRoot, CONFIG_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n");
}

export async function addLibraryToProject(
  projectRoot: string,
  library: string | ResolvedLibrary,
): Promise<boolean> {
  const config = (await loadProjectConfig(projectRoot)) ?? {};
  const libraries = config.libraries ?? [];

  const entry: ResolvedLibrary =
    typeof library === "string" ? { package: library, identifier: library } : library;

  if (libraries.some((l) => l.identifier === entry.identifier)) {
    return false; // already tracked
  }

  const updated = [...libraries, entry].sort((a, b) => a.package.localeCompare(b.package));
  await saveProjectConfig(projectRoot, { ...config, libraries: updated });
  return true;
}
