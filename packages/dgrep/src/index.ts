export { resolveAuth } from "./lib/auth.js";
export { detectAgents } from "./lib/agents.js";
export { resolveSource } from "./lib/providers.js";
export { loadConfig, saveConfig, configPath } from "./lib/config.js";
export { jsonLine, jsonResults, jsonError } from "./lib/output.js";
export {
  DgrepError,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
} from "./lib/errors.js";
export type { DgrepConfig } from "./lib/config.js";
export type { DetectedAgent } from "./lib/agents.js";
export type { SourceType, ResolvedSource } from "./lib/providers.js";
export type { JsonOutput, JsonResult, JsonError, JsonMeta } from "./lib/output.js";
export type {
  DgrepAuthConfig,
  SearchSection,
  SearchDocsResponse,
  ReadUrlResponse,
  CatalogLibrary,
  SearchCatalogResponse,
} from "./lib/api-client.js";
export { searchDocs, readUrl, searchCatalog } from "./lib/api-client.js";
