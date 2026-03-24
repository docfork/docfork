export { resolveAuth } from "./lib/auth.js";
export { detectAgents } from "./lib/agents.js";
export { resolveSource } from "./lib/providers.js";
export type { DgrepConfig } from "./lib/config.js";
export type { DetectedAgent } from "./lib/agents.js";
export type { SourceType, ResolvedSource } from "./lib/providers.js";
export type {
  DgrepAuthConfig,
  SearchSection,
  SearchDocsResponse,
  ReadUrlResponse,
  CatalogLibrary,
  SearchCatalogResponse,
} from "./lib/api-client.js";
export { searchDocs, readUrl, searchCatalog } from "./lib/api-client.js";
