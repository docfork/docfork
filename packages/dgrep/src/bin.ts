#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
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
      return yargs.positional("query", {
        type: "string",
        describe: "Search query",
      });
    },
    async (argv) => {
      const { search } = await import("./commands/search.js");
      await search(argv.query as string);
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
  .strict()
  .parse();
