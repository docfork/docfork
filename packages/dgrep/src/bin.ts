#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pc from "picocolors";
import { DgrepError } from "./lib/errors.js";

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName("dgrep")
    .usage("$0 [command]")
    .command("$0", "Interactive setup wizard", {}, async () => {
      const { wizard } = await import("./commands/wizard.js");
      await wizard();
    })
    .command("init", "Initialize dgrep in current project", {}, async () => {
      const { init } = await import("./commands/init.js");
      await init();
    })
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
        await add(argv.library as string);
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
          json: argv.json as boolean | undefined,
          yes: argv.yes as boolean | undefined,
          noSave: argv.save === false,
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
    .strict()
    .parse();
}

main().catch((err: unknown) => {
  if (err instanceof DgrepError) {
    console.error(pc.red(`Error: ${err.message}`));
    process.exit(err.exitCode);
  }
  console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
