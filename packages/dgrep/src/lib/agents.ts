/**
 * IDE/agent detection via filesystem probing
 */

export interface DetectedAgent {
  name: string;
  configPath: string;
}

export function detectAgents(): DetectedAgent[] {
  return [];
}
