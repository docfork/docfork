# Changelog

## [0.2.2](https://github.com/docfork/docfork/compare/dgrep-v0.2.1...dgrep-v0.2.2) (2026-05-25)


### Features

* **dgrep:** typed agent registry + OAuth-first setup + 6 editors ([#166](https://github.com/docfork/docfork/issues/166)) ([fcaefb6](https://github.com/docfork/docfork/commit/fcaefb6c52f5ffcf79e98fc5d355d00065f237c7))

## [0.2.1](https://github.com/docfork/docfork/compare/dgrep-v0.2.0...dgrep-v0.2.1) (2026-04-19)


### Features

* **dgrep:** send X-Docfork-Client header on /v1/telemetry POST ([#135](https://github.com/docfork/docfork/issues/135)) ([65ad429](https://github.com/docfork/docfork/commit/65ad4298e48e0101d9432040ba0eff48906fc608))
* Send `X-Docfork-Client: dgrep/<version>` header on telemetry POSTs for server-side consistency with real-API traffic (previously only set on API calls, not /v1/telemetry).

## [0.2.0](https://github.com/docfork/docfork/compare/dgrep-v0.1.2...dgrep-v0.2.0) (2026-04-17)


### Features

* **dgrep:** add fire-and-forget telemetry transport ([#127](https://github.com/docfork/docfork/issues/127)) ([3ed37ee](https://github.com/docfork/docfork/commit/3ed37eeca59e3c82daf540d3c6527c86355813d4))
* **dgrep:** define telemetry event schemas ([#128](https://github.com/docfork/docfork/issues/128)) ([1f489e4](https://github.com/docfork/docfork/commit/1f489e40c52901a8ce60f84e06ab715422862437))
* **dgrep:** send X-Docfork-Client header on every API request ([#126](https://github.com/docfork/docfork/issues/126)) ([3729dea](https://github.com/docfork/docfork/commit/3729dea917a75bbd8b1b1b2150706c47bc7d54df))
* **dgrep:** wire opt-out telemetry into the CLI ([#129](https://github.com/docfork/docfork/issues/129)) ([3fc4c4c](https://github.com/docfork/docfork/commit/3fc4c4c4818622af083e1157e68842113b0ca670))


### Documentation

* **dgrep:** add Privacy & Telemetry README section ([#132](https://github.com/docfork/docfork/issues/132)) ([8b118ce](https://github.com/docfork/docfork/commit/8b118cef01b823cbbd342543baff48cfe452e633))

## [0.1.2](https://github.com/docfork/docfork/compare/dgrep-v0.1.1...dgrep-v0.1.2) (2026-04-15)


### Bug Fixes

* **dgrep:** use absolute URL for demo.gif in README ([#125](https://github.com/docfork/docfork/issues/125)) ([6cd36d6](https://github.com/docfork/docfork/commit/6cd36d60ec9356b37810361401fb60f87581497e))

## [0.1.1](https://github.com/docfork/docfork/compare/dgrep-v0.1.0...dgrep-v0.1.1) (2026-04-11)


### Features

* **dgrep:** 4-tier library resolution (flag → project → package.json → catalog) ([c40ed7c](https://github.com/docfork/docfork/commit/c40ed7c7dde57046bc8ba11feb264df35ad0eada))
* **dgrep:** add color and doctor commands ([72af496](https://github.com/docfork/docfork/commit/72af49659708b88502b91d0b650c10afb863f156))
* **dgrep:** add command (catalog resolve, idempotent, --yes) ([c7410eb](https://github.com/docfork/docfork/commit/c7410eb0436fc57599ca6c4aee846257a5c39a13))
* **dgrep:** add dep-filter with pattern-based tooling exclusion ([ee4c98e](https://github.com/docfork/docfork/commit/ee4c98e234ff28140ae5d280ab64cd01bb65b7d3))
* **dgrep:** add detect-deps with monorepo workspace aggregation ([ad2e9d1](https://github.com/docfork/docfork/commit/ad2e9d16c2f8535b1c5afcc5cf1cced13f0b9ee1))
* **dgrep:** add list, remove commands + truncate status libraries at 10 ([c2308a3](https://github.com/docfork/docfork/commit/c2308a3386695a35a621c7854f75f852cb620984))
* **dgrep:** add resolve + batch search, new config format ([c6b5b5e](https://github.com/docfork/docfork/commit/c6b5b5ec19e6b8a6242e77db6b659d043acbea0a))
* **dgrep:** add status command (auth, project, libraries, agents, config paths) ([757ca04](https://github.com/docfork/docfork/commit/757ca0435e434dc7147843ff74faca43bdbb769d))
* **dgrep:** agent detection (Cursor, Claude Code via filesystem probe) ([0298a41](https://github.com/docfork/docfork/commit/0298a41536d5dd71bcc2f0fd3c592353eb03653b))
* **dgrep:** alpha release — init-first CLI with search, read, setup ([b015f97](https://github.com/docfork/docfork/commit/b015f97ee9cc0a2d5fa452b887b1242d48c70dd0))
* **dgrep:** alpha release — search, read, setup, init-first hierarchy ([da2c512](https://github.com/docfork/docfork/commit/da2c5124a6e63556de0f91c24d84a2127fca4462))
* **dgrep:** command stubs (wizard, init, add, search) ([1434a7d](https://github.com/docfork/docfork/commit/1434a7d880102dbc414ac59dfbae3a2222f0ae8c))
* **dgrep:** config file I/O (~/.dgrep/config.json with 0o600 perms) ([e48977d](https://github.com/docfork/docfork/commit/e48977d4b008a106412cb628136808895cc127af))
* **dgrep:** init command (package.json detection, interactive selection) ([2557cec](https://github.com/docfork/docfork/commit/2557cecef244d6bfa6a92b6fd0e31ffde94902f9))
* **dgrep:** init resolves deps against remote Docfork catalog ([7b173b9](https://github.com/docfork/docfork/commit/7b173b98474c1b8ad9ea10c8f9b1c2b0fe3c79a7))
* **dgrep:** lib stubs (auth, config, agents, providers) and barrel export ([dbe6df8](https://github.com/docfork/docfork/commit/dbe6df8d5fd7d0f463a29b07b3505ea8dda273f8))
* **dgrep:** NDJSON output module for --json flag ([1d595f8](https://github.com/docfork/docfork/commit/1d595f838fe5dcb710da53ac00df6419f91e5f38))
* **dgrep:** OAuth device flow and claim command ([b40b183](https://github.com/docfork/docfork/commit/b40b1834aa21c97c72aac684eddded9c7507b745))
* **dgrep:** per-agent MCP config (Cursor, Claude Code, OpenCode) ([11935a5](https://github.com/docfork/docfork/commit/11935a5b7f4c58c5192c471c0a3a9303cf3b3f5d))
* **dgrep:** project config (.dgrep/config.json with walk-up discovery) ([6fbbf6e](https://github.com/docfork/docfork/commit/6fbbf6ebcf4d107863f893d089367d99cf53f679))
* **dgrep:** search command (parallel multi-lib, pretty + NDJSON, remember pattern) ([7031f10](https://github.com/docfork/docfork/commit/7031f10cc612251551bd00ac9c0d0b6ade6ae35c))
* **dgrep:** set real WorkOS client ID for device flow ([1ff8e6a](https://github.com/docfork/docfork/commit/1ff8e6abcc222995682ec11e132074cbe00c2edf))
* **dgrep:** standalone API client (v1 REST, isolated from MCP) ([9d7268a](https://github.com/docfork/docfork/commit/9d7268a7bb7b4883773182b73ff7ccb57e74a749))
* **dgrep:** structured error handling with exit codes ([6c39ed1](https://github.com/docfork/docfork/commit/6c39ed130da95f7a1fe125043990e95eed5550d1))
* **dgrep:** use POST /v1/keys/exchange for login, unclaimedApiKey optional ([46b1a49](https://github.com/docfork/docfork/commit/46b1a49cc93f9d2b9b3cf69ef46d0b78b77007fb))
* **dgrep:** use remote MCP URL (mcp.docfork.com) instead of npx docfork@latest ([d17bb5d](https://github.com/docfork/docfork/commit/d17bb5dabff1ce3202f4c57975860af853aed750))
* **dgrep:** wire up dynamic accent color across all commands ([5ea0af3](https://github.com/docfork/docfork/commit/5ea0af3a650c4b77f7cea3bab6ce68ce67d1f05a))
* **dgrep:** wizard (provision key, detect agents, write MCP configs) ([40ec6b9](https://github.com/docfork/docfork/commit/40ec6b9ed5230a792502c4db1081b69ef8526d5d))


### Bug Fixes

* **ci:** add .prettierignore to packages for changelogs ([2d98f16](https://github.com/docfork/docfork/commit/2d98f16799364c743b6e53a87b5f80034a1a4454))
* **ci:** add .prettierignore to packages for release-please changelogs ([ca24e45](https://github.com/docfork/docfork/commit/ca24e45cdd5280d2297c6a4c08e1c638b52e61e7))
* **dgrep:** add -h alias for --help ([660f047](https://github.com/docfork/docfork/commit/660f047dbf0bf3e4b5a17803b333616c72ab085b))
* **dgrep:** correct WorkOS device flow endpoints and content type ([1677129](https://github.com/docfork/docfork/commit/16771299bb587f3d7adb6677f6f4744d667e9838))
* **dgrep:** fix undefined apiKey in wizard manual command display ([19e3af0](https://github.com/docfork/docfork/commit/19e3af03ad6bdcd572f3ff05a72a884ffab73f93))
* **dgrep:** login preserves API key on claim, logout checks claimedAt ([4c6ade4](https://github.com/docfork/docfork/commit/4c6ade479fa2ecaec8f3159a808ad81dc6b6442e))
