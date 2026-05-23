// public barrel.
export { Docfork, type DocforkOptions } from "./client";
export {
  DocforkError,
  AuthenticationError,
  InvalidRequestError,
  RateLimitError,
  APIError,
  type DocforkErrorBody,
} from "./errors";
export { Page, type PageData } from "./pagination";
export type {
  Library,
  LibraryVersion,
  LibraryList,
  LibraryVersionList,
  ReadResponse,
  SearchRequest,
  SearchResponse,
  SearchSection,
  SearchMeta,
  Source,
} from "./gen/types.gen";
