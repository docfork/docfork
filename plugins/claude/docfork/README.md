# Docfork

Up-to-date and secure docs search for AI agents. Search 10,000+ libraries and lock your agent to your stack with Cabinets.

## Installation

Add the Docfork marketplace and install the plugin:

```bash
/plugin marketplace add docfork/docfork
/plugin install docfork@docfork
```

Or from a local path:

```bash
/plugin marketplace add ./path/to/docfork-repo
/plugin install docfork@docfork
```

## Components

### MCP Server

| Tool                 | Description                                                                                                                                      |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `docfork:search_docs` | Search documentation across libraries. Returns chunks with titles, descriptions, and URLs                                                        |
| `docfork:fetch_doc`   | Fetch full markdown content from a `search_docs` result URL, or strip the anchor and filename to get a table of contents for the parent directory |

### Skills

| Skill             | Description                                                                                      |
| :---------------- | :----------------------------------------------------------------------------------------------- |
| `docfork-docs`    | Query and fetch current library documentation using Docfork. Invoke with `/docfork:docfork-docs` |

### Rules

| Rule          | Description                                                                       |
| :------------ | :-------------------------------------------------------------------------------- |
| `use-docfork` | Steers the agent to fetch library documentation rather than rely on training data |

### Agents

| Agent             | Description                                                                                                                    |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `docs-researcher` | Fetches library documentation in an isolated context. Use when accurate API references or version-specific examples are needed |

### Commands

| Command         | Description                                                                           |
| :-------------- | :------------------------------------------------------------------------------------ |
| `/docfork:docs` | Fetch current documentation for any library. Usage: `/docfork:docs <library> [query]` |

## License

MIT
