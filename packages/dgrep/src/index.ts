// Auth & config
export { resolveAuth } from "./lib/auth.js";
export { loadConfig, saveConfig, configPath } from "./lib/config.js";
export {
  loadProjectConfig,
  saveProjectConfig,
  addLibraryToProject,
  findProjectRoot,
} from "./lib/project-config.js";
export type { DgrepConfig } from "./lib/config.js";
export type { ProjectConfig } from "./lib/project-config.js";

// Library resolution
export { resolveLibraries } from "./lib/resolve-libraries.js";
export { resolveSource } from "./lib/providers.js";
export type { ResolvedLibraries, LibrarySource } from "./lib/resolve-libraries.js";
export type { SourceType, ResolvedSource } from "./lib/providers.js";

// Agent detection
export { detectAgents } from "./lib/agents.js";
export type { DetectedAgent } from "./lib/agents.js";

// API client
export { searchDocs, readUrl, searchCatalog } from "./lib/api-client.js";
export type {
  DgrepAuthConfig,
  SearchSection,
  SearchDocsResponse,
  ReadUrlResponse,
  CatalogLibrary,
  SearchCatalogResponse,
} from "./lib/api-client.js";

// Output
export { jsonLine, jsonResults, jsonError } from "./lib/output.js";
export type {
  JsonOutput,
  JsonResult,
  JsonError,
  JsonMeta,
  JsonReadMeta,
  JsonReadContent,
} from "./lib/output.js";

// Stats
export { loadStats, incrementSearches, incrementReads } from "./lib/stats.js";
export type { LibraryStats, StatsFile } from "./lib/stats.js";

// Errors
export {
  DgrepError,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
} from "./lib/errors.js";
