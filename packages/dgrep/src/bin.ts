#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pc from "picocolors";
import { DgrepError } from "./lib/errors.js";
import { loadAccent } from "./lib/theme.js";
import { VERSION } from "./lib/version.js";
import { loadConfig } from "./lib/config.js";
import { AGENTS } from "./lib/agents.js";
import { ensureInstallId, isTelemetryEnabled, showFirstRunNotice } from "./lib/telemetry/optout.js";
import { captureCommandExecuted, captureError, captureInstall } from "./lib/telemetry/events.js";
import { isCI } from "./lib/telemetry/transport.js";

function countFlags(): number {
  return process.argv.slice(2).filter((a) => a.startsWith("-")).length;
}

// Runs before any command handler. On the very first invocation after install
// (no `config.telemetry` block yet), prints the notice and persists an
// install_id + `enabled: true`. Env-var opt-out skips both the notice and the
// persistence, so users who set `DO_NOT_TRACK=1` never have an install_id
// recorded.
async function firstRunMiddleware(argv: Record<string, unknown>): Promise<void> {
  const config = await loadConfig();
  if (config.telemetry) return;

  const state = isTelemetryEnabled(config);
  if (!state.enabled) return;

  if (!argv.json) {
    await showFirstRunNotice();
  }
  const installId = await ensureInstallId();
  void captureInstall(installId, {
    os: process.platform,
    arch: process.arch,
    node_version: process.version,
    dgrep_version: VERSION,
    install_id: installId,
    ci: isCI(),
  });
}

// Fires dgrep_command_executed (always) and dgrep_error (on failure). On
// success the fetch is not awaited — Node waits for pending I/O on natural
// exit. On failure the caller races with a 1s timeout before rethrowing.
async function fireCommandOutcome(opts: {
  start: number;
  success: boolean;
  argv?: { _?: (string | number)[]; json?: boolean; "api-key"?: string };
  err?: unknown;
}): Promise<void> {
  const config = await loadConfig();
  const state = isTelemetryEnabled(config);
  if (!state.enabled || !config.telemetry?.installId) return;

  const installId = config.telemetry.installId;
  const command = (opts.argv?._?.[0] as string | undefined) ?? "unknown";
  const latencyMs = Date.now() - opts.start;
  const jsonMode = !!opts.argv?.json;
  const authenticated = !!(config.apiKey || process.env.DOCFORK_API_KEY || opts.argv?.["api-key"]);

  const exitCode =
    !opts.success && opts.err instanceof DgrepError ? opts.err.exitCode : opts.success ? 0 : 1;

  const tasks: Promise<void>[] = [
    captureCommandExecuted(installId, {
      command,
      success: opts.success,
      exit_code: exitCode,
      latency_ms: latencyMs,
      flag_count: countFlags(),
      json_mode: jsonMode,
      authenticated,
      dgrep_version: VERSION,
      node_version: process.version,
      os: process.platform,
    }),
  ];

  if (!opts.success) {
    tasks.push(
      captureError(installId, {
        command,
        error_class: opts.err instanceof Error ? opts.err.constructor.name : "Unknown",
        exit_code: exitCode,
        dgrep_version: VERSION,
        node_version: process.version,
        os: process.platform,
      })
    );
  }

  await Promise.all(tasks);
}

async function main() {
  const start = Date.now();
  await loadAccent();
  let parsed: { _?: (string | number)[]; json?: boolean; "api-key"?: string } | undefined;

  try {
    parsed = (await buildCli().parse()) as typeof parsed;
    void fireCommandOutcome({ start, success: true, argv: parsed });
  } catch (err) {
    // race the error-case flush with a 1s timeout so a slow collector never
    // delays the exit by more than a second
    await Promise.race([
      fireCommandOutcome({ start, success: false, argv: parsed, err }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    throw err;
  }
}

function buildCli() {
  return yargs(hideBin(process.argv))
    .scriptName("dgrep")
    .usage("$0 [command]")
    .middleware(firstRunMiddleware)
    .command("$0", "Initialize dgrep in current project", {}, async (argv) => {
      const { findProjectRoot, loadProjectConfig } = await import("./lib/project-config.js");
      const cwd = process.cwd();
      const projectRoot = await findProjectRoot(cwd);
      const config = projectRoot ? await loadProjectConfig(projectRoot) : null;

      if (config?.libraries && config.libraries.length > 0) {
        // already initialized — show compact status
        const pc = (await import("picocolors")).default;
        console.log("");
        console.log(
          `  ${pc.bold("dgrep")} ${pc.dim(`v${VERSION}`)} — ${config.libraries.length} libraries tracked`
        );
        console.log("");
        console.log(`  ${pc.dim("dgrep search <query>")}    Search documentation`);
        console.log(`  ${pc.dim("dgrep read <url>")}        Read content`);
        console.log(`  ${pc.dim("dgrep setup")}             Setup IDE agents`);
        console.log(`  ${pc.dim("dgrep status")}            Show configuration`);
        console.log(`  ${pc.dim("dgrep init")}              Re-initialize project`);
        console.log("");
      } else {
        const { init } = await import("./commands/init.js");
        await init({ yes: argv.yes as boolean | undefined });
      }
    })
    .command("init", "Initialize dgrep in current project", {}, async (argv) => {
      const { init } = await import("./commands/init.js");
      await init({ yes: argv.yes as boolean | undefined });
    })
    .command(
      "setup",
      "Setup IDE agent integrations",
      (yargs) => {
        return yargs.option("agent", {
          type: "string",
          array: true,
          choices: Object.keys(AGENTS),
          describe: "Limit setup to one or more agents (default: all detected)",
        });
      },
      async (argv) => {
        const { setup } = await import("./commands/setup.js");
        await setup({
          agents: argv.agent as string[] | undefined,
          yes: argv.yes as boolean | undefined,
        });
      }
    )
    .command(
      "add <library>",
      "Add a library to your stack",
      (yargs) => {
        return yargs.positional("library", {
          type: "string",
          describe: "Library name or owner/repo",
        });
      },
      async (argv) => {
        const { add } = await import("./commands/add.js");
        await add(argv.library as string, {
          yes: argv.yes as boolean | undefined,
        });
      }
    )
    .command(
      "search <query>",
      "Search documentation",
      (yargs) => {
        return yargs
          .positional("query", {
            type: "string",
            describe: "Search query",
          })
          .option("library", {
            alias: "l",
            type: "string",
            array: true,
            describe: "Library to search (overrides auto-detection)",
          })
          .option("limit", {
            type: "number",
            default: 10,
            describe: "Maximum number of results to return",
          })
          .option("save", {
            type: "boolean",
            default: true,
            describe: "Remember this library for future searches (use --no-save to skip)",
          })
          .option("cabinet", {
            type: "string",
            describe: "Org cabinet for private docs",
          });
      },
      async (argv) => {
        const { search } = await import("./commands/search.js");
        await search(argv.query as string, {
          libraries: argv.library as string[] | undefined,
          limit: argv.limit as number | undefined,
          json: argv.json as boolean | undefined,
          yes: argv.yes as boolean | undefined,
          noSave: argv.save === false,
          apiKey: argv["api-key"] as string | undefined,
          cabinet: argv.cabinet as string | undefined,
        });
      }
    )
    .command(
      "read <url>",
      "Read documentation content by URL",
      (yargs) => {
        return yargs
          .positional("url", {
            type: "string",
            describe: "Documentation URL from search results",
          })
          .option("tokens", {
            type: "number",
            default: 20000,
            describe: "Token budget for content length",
          })
          .option("cabinet", {
            type: "string",
            describe: "Org cabinet for private docs",
          });
      },
      async (argv) => {
        const { read } = await import("./commands/read.js");
        await read(argv.url as string, {
          json: argv.json as boolean | undefined,
          tokens: argv.tokens as number | undefined,
          apiKey: argv["api-key"] as string | undefined,
          cabinet: argv.cabinet as string | undefined,
        });
      }
    )
    .command("login", "Log in to your Docfork account", {}, async () => {
      const { login } = await import("./commands/login.js");
      await login();
    })
    .command("logout", "Log out and clear credentials", {}, async (argv) => {
      const { logout } = await import("./commands/logout.js");
      await logout({ yes: argv.yes as boolean | undefined });
    })
    .command("status", "Show dgrep configuration and status", {}, async (argv) => {
      const { status } = await import("./commands/status.js");
      await status({ json: argv.json as boolean | undefined });
    })
    .command(
      "color [color]",
      "Set accent color",
      (yargs) => {
        return yargs.positional("color", {
          type: "string",
          describe: "Color name (cyan, red, green, yellow, blue, magenta, default)",
        });
      },
      async (argv) => {
        const { color } = await import("./commands/color.js");
        await color(argv.color as string | undefined);
      }
    )
    .command("doctor", "Diagnose dgrep setup and connectivity", {}, async (argv) => {
      const { doctor } = await import("./commands/doctor.js");
      await doctor({ json: argv.json as boolean | undefined });
    })
    .command("list", "List tracked libraries", {}, async (argv) => {
      const { list } = await import("./commands/list.js");
      await list({ json: argv.json as boolean | undefined });
    })
    .command(
      "remove <library>",
      "Remove a library from tracking",
      (yargs) => {
        return yargs.positional("library", {
          type: "string",
          describe: "Library to remove",
        });
      },
      async (argv) => {
        const { remove } = await import("./commands/remove.js");
        await remove(argv.library as string, {
          yes: argv.yes as boolean | undefined,
        });
      }
    )
    .command(
      "telemetry <action>",
      "Manage anonymous usage telemetry",
      (yargs) => {
        return yargs.positional("action", {
          type: "string",
          choices: ["status", "enable", "disable"] as const,
          describe: "Telemetry action",
        });
      },
      async (argv) => {
        const action = argv.action as "status" | "enable" | "disable";
        const mod = await import("./commands/telemetry.js");
        if (action === "disable") await mod.telemetryDisable();
        else if (action === "enable") await mod.telemetryEnable();
        else await mod.telemetryStatus();
      }
    )
    .option("yes", {
      alias: "y",
      type: "boolean",
      description: "Skip interactive prompts (CI mode)",
    })
    .option("json", {
      type: "boolean",
      description: "Output as NDJSON",
    })
    .option("api-key", {
      type: "string",
      description: "Docfork API key",
    })
    .version()
    .help()
    .alias("h", "help")
    .strict();
}

main().catch((err: unknown) => {
  if (err instanceof DgrepError) {
    console.error(pc.red(`Error: ${err.message}`));
    process.exit(err.exitCode);
  }
  console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
