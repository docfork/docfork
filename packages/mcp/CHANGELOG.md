# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
