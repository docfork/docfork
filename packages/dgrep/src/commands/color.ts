import pc from "picocolors";
import { loadConfig, saveConfig } from "../lib/config.js";

const DEFAULT_COLOR = "blue";
const COLORS = ["cyan", "red", "green", "yellow", "blue", "magenta"] as const;
type AccentColor = (typeof COLORS)[number];

const COLOR_FN: Record<AccentColor, (s: string) => string> = {
  cyan: pc.cyanBright,
  red: pc.redBright,
  green: pc.greenBright,
  yellow: pc.yellowBright,
  blue: pc.blueBright,
  magenta: pc.magentaBright,
};

export async function color(value?: string): Promise<void> {
  const config = await loadConfig();
  const current = config.accentColor;

  // Show current + available
  if (!value) {
    console.log(`\n  ${pc.bold("dgrep color")}\n`);
    console.log(`  Current: ${current ?? `${DEFAULT_COLOR} (default)`}\n`);
    for (const c of COLORS) {
      const fn = COLOR_FN[c];
      const marker = c === (current ?? DEFAULT_COLOR) ? " ←" : "";
      console.log(`  ${fn("■")} ${c}${pc.dim(marker)}`);
    }
    console.log(`\n  Usage: ${pc.dim("dgrep color <name>")}`);
    console.log(`         ${pc.dim("dgrep color default")}\n`);
    return;
  }

  // Reset
  if (value === "default") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accentColor, ...rest } = config;
    await saveConfig(rest);
    console.log(`  Accent color reset to ${pc.blueBright(DEFAULT_COLOR)} (default)`);
    return;
  }

  // Validate
  if (!COLORS.includes(value as AccentColor)) {
    console.log(`  Unknown color: ${value}`);
    console.log(`  Available: ${COLORS.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // Save
  await saveConfig({ ...config, accentColor: value });
  const fn = COLOR_FN[value as AccentColor];
  console.log(`  Accent color set to ${fn(value)}`);
}
