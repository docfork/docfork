const TELEMETRY_URL = "https://api.docfork.com/v1/telemetry";

// Widely-set CI variables. Mirrors vercel-labs/add-skill.
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

// `DO_NOT_TRACK` is the consoledonottrack.com convention: any truthy value
// opts the user out. `DGREP_TELEMETRY=0` is a dgrep-specific override so the
// user can turn telemetry off without affecting other CLIs that honor
// `DO_NOT_TRACK`. Config-based opt-out is layered on top by callers.
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, distinct_id: distinctId, properties }),
    }).then(
      () => undefined,
      () => undefined
    );
  } catch {
    return Promise.resolve();
  }
}
