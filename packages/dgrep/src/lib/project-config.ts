import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";

export interface ProjectConfig {
  libraries?: string[];
  cabinet?: string;
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

export async function addLibraryToProject(projectRoot: string, library: string): Promise<boolean> {
  const config = (await loadProjectConfig(projectRoot)) ?? {};
  const libraries = config.libraries ?? [];

  if (libraries.includes(library)) {
    return false; // already tracked
  }

  const updated = [...libraries, library].sort();
  await saveProjectConfig(projectRoot, { ...config, libraries: updated });
  return true;
}
