import pc from "picocolors";
import { loadConfig } from "./config.js";

type ColorFn = (s: string) => string;

const ACCENT_FNS: Record<string, { fg: ColorFn; bg: ColorFn }> = {
  cyan: { fg: pc.cyanBright, bg: pc.bgCyan },
  red: { fg: pc.redBright, bg: pc.bgRed },
  green: { fg: pc.greenBright, bg: pc.bgGreen },
  yellow: { fg: pc.yellowBright, bg: pc.bgYellow },
  blue: { fg: pc.blueBright, bg: pc.bgBlue },
  magenta: { fg: pc.magentaBright, bg: pc.bgMagenta },
};

const DEFAULT = "blue";

let cached: { fg: ColorFn; bg: ColorFn } | null = null;

export async function loadAccent(): Promise<{ fg: ColorFn; bg: ColorFn }> {
  if (cached) return cached;
  const config = await loadConfig();
  const name = config.accentColor;
  cached = ACCENT_FNS[name ?? DEFAULT] ?? ACCENT_FNS[DEFAULT];
  return cached;
}

export function accent(): { fg: ColorFn; bg: ColorFn } {
  return cached ?? ACCENT_FNS[DEFAULT];
}

// -- Banner -----------------------------------

const LOGO_LINES = [
  "     █████                                   ",
  "    ██   ██  ██████  ██████  ██████ ██████   ",
  "   ██   ██ ██      ██   ██ ██     ██   ██   ",
  "  ██   ██ ██  ███ ██████  █████  ██████    ",
  " ██   ██ ██   ██ ██  ██  ██     ██        ",
  "█████   ██████ ██   ██ ██████ ██         ",
];

export function showBanner(): void {
  const color = accent().fg;
  console.log("");
  for (const line of LOGO_LINES) {
    console.log(`  ${color(line)}`);
  }
  console.log("");
}
