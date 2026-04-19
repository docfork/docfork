import { VERSION } from "../version.js";

const TELEMETRY_URL = "https://api.docfork.com/v1/telemetry";

export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.BUILDKITE ||
    process.env.JENKINS_URL ||
    process.env.TEAMCITY_VERSION
  );
}

// Two env vars. `DO_NOT_TRACK` opts the user out with any truthy value;
// `DGREP_TELEMETRY=0` is a dgrep-specific override for users who want to
// disable dgrep without affecting other tools on their machine.
// Config-based opt-out is layered on top by callers.
function envOptOut(): boolean {
  if (process.env.DO_NOT_TRACK && process.env.DO_NOT_TRACK !== "0") return true;
  if (process.env.DGREP_TELEMETRY === "0") return true;
  return false;
}

export function track(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>
): Promise<void> {
  if (envOptOut()) return Promise.resolve();
  try {
    return fetch(TELEMETRY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // `?? "unknown"` keeps the emission readable if the VERSION import
        // ever regresses (build glitch, circular import) instead of
        // silently poisoning attribution with "dgrep/undefined".
        "X-Docfork-Client": `dgrep/${VERSION ?? "unknown"}`,
      },
      body: JSON.stringify({ event, distinct_id: distinctId, properties }),
    }).then(
      () => undefined,
      () => undefined
    );
  } catch {
    return Promise.resolve();
  }
}
