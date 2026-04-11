/**
 * Source registry — resolves user input to a source type
 */

export type SourceType = "catalog" | "github" | "url";

export interface ResolvedSource {
  type: SourceType;
  identifier: string;
}

export function resolveSource(input: string): ResolvedSource {
  // owner/repo pattern
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/.test(input)) {
    return { type: "github", identifier: input };
  }

  // URL pattern
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return { type: "url", identifier: input };
  }

  // default: catalog lookup
  return { type: "catalog", identifier: input };
}
