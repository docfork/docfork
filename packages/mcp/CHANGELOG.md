# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.5](https://github.com/docfork/docfork/compare/docfork-v2.2.4...docfork-v2.2.5) (2026-05-25)


### Bug Fixes

* **mcp:** return 403 on disallowed Origin header (DOC-370) ([#164](https://github.com/docfork/docfork/issues/164)) ([ba4409e](https://github.com/docfork/docfork/commit/ba4409e49c73c2a6b62bf4da6111b07a47c586bb))

## [2.2.4](https://github.com/docfork/docfork/compare/docfork-v2.2.3...docfork-v2.2.4) (2026-05-24)


### Bug Fixes

* **mcp:** validate token audience (aud) in jwt verification ([#161](https://github.com/docfork/docfork/issues/161)) ([77e4319](https://github.com/docfork/docfork/commit/77e43198ee00636e1339b3b29841c9f3cfc9f0ff))

## [2.2.3](https://github.com/docfork/docfork/compare/docfork-v2.2.2...docfork-v2.2.3) (2026-05-24)


### Bug Fixes

* **mcp:** serve RFC 9728 path-aware OAuth discovery metadata ([#155](https://github.com/docfork/docfork/issues/155)) ([1cbcc9e](https://github.com/docfork/docfork/commit/1cbcc9e1f0103d0e5273fef6e017f920ec8f20e4))


### Miscellaneous Chores

* **mcp:** force docfork release to 2.2.3 ([#157](https://github.com/docfork/docfork/issues/157)) ([0e85c46](https://github.com/docfork/docfork/commit/0e85c46c2d1266a3456e576f3049e17f63ae4f96))
* **sdk:** force first release to 0.0.1 ([#146](https://github.com/docfork/docfork/issues/146)) ([c8626af](https://github.com/docfork/docfork/commit/c8626afa5a0402f5723a68942c2cfc373094567c))

## [2.2.2](https://github.com/docfork/docfork/compare/docfork-v2.2.1...docfork-v2.2.2) (2026-05-18)


### Features

* **mcp:** capture mcp_initialize and mcp_tool_call server-side ([#142](https://github.com/docfork/docfork/issues/142)) ([d0eff21](https://github.com/docfork/docfork/commit/d0eff215f2f20b49dca9e01351317667f5544e0e))

## [2.2.1](https://github.com/docfork/docfork/compare/docfork-v2.2.0...docfork-v2.2.1) (2026-04-19)


### Features

* **mcp:** emit X-Docfork-Client header for cross-surface tagging ([#136](https://github.com/docfork/docfork/issues/136)) ([98bc7ef](https://github.com/docfork/docfork/commit/98bc7ef22bbfc34e7d9e6cb49c5fe9d965cd4d80))
* Add `X-Docfork-Client: mcp-server/<version>` header on backend requests so the upstream API service can tag requests by client surface.

## [2.2.0](https://github.com/docfork/docfork/compare/docfork-v2.1.0...docfork-v2.2.0) (2026-04-14)


### Features

* **mcp:** update MCP tools to v5 (improved chaining and descriptions) ([9998829](https://github.com/docfork/docfork/commit/9998829497597dd4f3174117ec6ddae4c1692fc2))


### Bug Fixes

* **ci:** add .prettierignore to packages for changelogs ([2d98f16](https://github.com/docfork/docfork/commit/2d98f16799364c743b6e53a87b5f80034a1a4454))
* **ci:** add .prettierignore to packages for release-please changelogs ([ca24e45](https://github.com/docfork/docfork/commit/ca24e45cdd5280d2297c6a4c08e1c638b52e61e7))
* **ci:** add gemini-extension.json to prettierignore ([7a1e8f5](https://github.com/docfork/docfork/commit/7a1e8f5777f0a85c6893949e0147db68d3a89b78))
* **ci:** add gemini-extension.json to prettierignore ([17fdcc1](https://github.com/docfork/docfork/commit/17fdcc1316d053ba44409cafb737084d622f1be2))

## [2.1.0] - 2026-03-04 — MCP tools v5

### Added

- `lib/constants.ts` — centralizes `SERVER_VERSION` (from package.json) and `API_URL`

### Changed

- **Tool renames**: `query_docs` → `search_docs`, `fetch_url` → `fetch_doc`
- Expanded server instructions with explicit use cases (API usage, migrations, framework setup, SDK methods)
- Clearer tool descriptions and workflow guidance (search → fetch_doc on result URLs)
- Simplified search result format: header with result count, numbered results with truncated titles/descriptions
- Server version and config now read from constants instead of hardcoded values

## [2.0.0] - 2026-02-12 — Sharper tools

### Added

- `query_docs` results now include a description field so your agent picks the right doc before fetching
- `fetch_url` **supports partial paths** (e.g. `/docs/01-app`) and returns a table of contents with chunk previews. Full chunk URLs remain the default for reading content.
- `readOnlyHint` annotations on all tools for safer client auto-approval

### Changed

- **Rewrote and compressed both tool prompts** with shorter descriptions, structured format, and good/bad contrastive examples
- Scoped `fetch_url` to URLs from `query_docs` results only
- Unified stdio and HTTP into a single transport. Less config, fewer moving parts so contributions are now easier to make.
- Search results return descriptions only. Leaner context window, fewer wasted tokens
- Consolidated release publishing into one workflow and switched npm publishing to GitHub OIDC trusted publishing (tokenless)

### Removed

- OpenAI-specific endpoint. Standard MCP transport covers all clients now, including OpenAI. One path to maintain, zero edge cases.

## [1.4.0] - 2026-01-18 — OAuth Support

### Added

- OAuth 2.0 authentication support — new `/mcp/oauth` endpoint with full JWT validation via `jose`
- OAuth Protected Resource Metadata discovery via `/.well-known/oauth-protected-resource`
- Stateless HTTP transport — removed `MCP-Session-ID` management to reduce overhead and latency
- Enabled `enableJsonResponse` for faster non-streamable requests
- Request body size limits for security

### Changed

- `/mcp` endpoint remains fully supported for API key authentication (backward compatible)
- Code formatting and readability improvements

## [1.3.4] - 2026-01-17

### Fixed

- Proxy compatibility for streamable HTTP transport
- Stateless GET support and client info logging
- Removed unused userAgent parameter from client detection

## [1.3.3] - 2026-01-14 — Security Updates & Workflows

### Added

- npm version lifecycle scripts to sync server.json
- CI, Dependabot, and MCP registry workflows
- Prettier config and codebase formatting

## [1.3.0] - 2026-01-10 — User Dashboard, API Keys & Cabinets

### Added

- Authentication configuration system with API key support
- `--api-key` and `--cabinet` CLI flags for local MCP
- `Authorization: Bearer`, `DOCFORK_API_KEY`, `DOCFORK_CABINET` header support
- `DOCFORK_API_KEY` and `DOCFORK_CABINET` environment variable support
- AsyncLocalStorage for HTTP transport auth context
- Client IP forwarding for per-user rate limiting
- Enhanced CORS support with custom authentication headers
- Gemini CLI extension support
- SECURITY.md with vulnerability reporting process

### Fixed

- Removed unused resources and prompts from server registration that caused Cursor to confuse tools with resources

## [1.2.2] - 2026-01-06

### Added

- `API_URL` environment variable override for base URL

## [1.2.1] - 2025-12-26

### Changed

- Default transport reverted from `streamable-http` to `stdio` for improved out-of-the-box compatibility with MCP clients

### Fixed

- EADDRINUSE crashes — automatic port discovery for `streamable-http` transport (up to 10 retries) (closes #28)

### Removed

- Unused `eslint-plugin-prettier` dependency

## [1.2.0] - 2025-12-24

### Added

- Request timeouts and new GET endpoints for MCP configuration and server card
- Major architecture restructure with OpenAI client support
- Improved integration capabilities and more robust error handling

## [1.1.0] - 2025-12-22

### Added

- HTTP transport request timeouts and GET endpoints for MCP config retrieval

### Fixed

- GET endpoint support for HTTP transport (MCP client compatibility)

## [1.0.6] - 2025-12-22

### Added

- GET endpoint support for HTTP transport (MCP client compatibility)

### Changed

- Simplified npm-publish workflow

## [1.0.5] - 2025-12-12

### Changed

- Bumped @modelcontextprotocol/sdk from 1.20.2 to 1.24.0
- Resolved linting errors and improved dotenv config

## [1.0.4] - 2025-11-04

### Added

- `docfork_search_docs` tool — semantic search for finding documentation with intelligent query matching
- `docfork_read_docs` tool — streamlined content retrieval with direct markdown/text extraction
- Extra error handling for HTTP server initialization

## [1.0.1] - 2025-11-04

### Fixed

- Documentation reference in README for `docfork_search_docs`

### Changed

- Refactored server.json schema and registry configuration

## [1.0.0] - 2025-10-05

### Added

- MCP Registry integration for simplified server discovery and installation
- Enhanced npm publish workflow with MCP Registry publishing
- Package metadata updated to reflect 9,000+ indexed libraries

### Changed

- Updated API base URL for production deployment

## [0.7.2] - 2025-09-18

### Changed

- Updated namespace to `com.docfork` and published to MCP registry

### Security

- Fixed reflected cross-site scripting vulnerability

## [0.7.1] - 2025-09-13

### Added

- New API for library documentation fetching
- MCP server registry publishing configuration
- Improved indexing and retrieval algorithms for faster search
- Enhanced file format support including `.rst` parsing

## [0.6.1] - 2025-08-11

### Fixed

- Dockerfile and package.json for streamable HTTP transport

## [0.6.0] - 2025-08-10

### Fixed

- DNS rebinding protection blocking external hostnames

## [0.5.5] - 2025-08-10

### Added

- Streamable HTTP transport and improved session management

## [0.5.3] - 2025-06-18

### Added

- Custom `X-Docfork-Source` header to fetchLibraryDocs for improved documentation tracking
- .dockerignore file to exclude unnecessary files from Docker builds

## [0.5.2] - 2025-06-11

### Fixed

- Main entry point in package.json to point to dist/index.js

## [0.5.0] - 2025-06-08

### Added

- Dockerfile and Smithery configuration

### Changed

- Improved prompt clarity to specify author + libraryName pair for better lookup accuracy

## [0.4.6] - 2025-06-06

### Added

- Installation instructions for Augment Code and Roo Code
