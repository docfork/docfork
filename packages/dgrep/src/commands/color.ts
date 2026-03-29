import pc from "picocolors";
import { loadConfig, saveConfig } from "../lib/config.js";

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
  const current = (config as Record<string, unknown>).accentColor as string | undefined;

  // Show current + available
  if (!value) {
    console.log(`\n  ${pc.bold("dgrep color")}\n`);
    console.log(`  Current: ${current ?? "red"} (default)\n`);
    for (const c of COLORS) {
      const fn = COLOR_FN[c];
      const marker = c === (current ?? "red") ? " ←" : "";
      console.log(`  ${fn("■")} ${c}${pc.dim(marker)}`);
    }
    console.log(`\n  Usage: ${pc.dim("dgrep color <name>")}`);
    console.log(`         ${pc.dim("dgrep color default")}\n`);
    return;
  }

  // Reset
  if (value === "default") {
    const { accentColor: _, ...rest } = config as Record<string, unknown>;
    await saveConfig(rest as Parameters<typeof saveConfig>[0]);
    console.log(`  Accent color reset to ${pc.blueBright("blue")} (default)`);
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
  await saveConfig({ ...config, accentColor: value } as Parameters<typeof saveConfig>[0]);
  const fn = COLOR_FN[value as AccentColor];
  console.log(`  Accent color set to ${fn(value)}`);
}
