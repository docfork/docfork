import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { track, isCI } from "../../../src/lib/telemetry/transport.js";
import { server } from "../../setup.js";

const TELEMETRY_URL = "https://api.docfork.com/v1/telemetry";

const CI_ENV_VARS = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "CIRCLECI",
  "TRAVIS",
  "BUILDKITE",
  "JENKINS_URL",
  "TEAMCITY_VERSION",
];

describe("track", () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ["DO_NOT_TRACK", "DGREP_TELEMETRY", ...CI_ENV_VARS]) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("POSTs to /v1/telemetry with the expected body shape", async () => {
    let received: unknown = null;
    server.use(
      http.post(TELEMETRY_URL, async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_command_executed", "550e8400-e29b-41d4-a716-446655440000", {
      command: "search",
      success: true,
    });

    expect(received).toEqual({
      event: "dgrep_command_executed",
      distinct_id: "550e8400-e29b-41d4-a716-446655440000",
      properties: { command: "search", success: true },
    });
  });

  it("sends X-Docfork-Client header so the backend can tag client_surface from the header", async () => {
    let clientHeader: string | null = null;
    server.use(
      http.post(TELEMETRY_URL, ({ request }) => {
        clientHeader = request.headers.get("x-docfork-client");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_command_executed", "550e8400-e29b-41d4-a716-446655440000", {});

    expect(clientHeader).toMatch(/^dgrep\/\d+\.\d+\.\d+/);
  });

  it("resolves without throwing when the server returns an error", async () => {
    server.use(
      http.post(TELEMETRY_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(
      track("dgrep_error", "550e8400-e29b-41d4-a716-446655440000", {}),
    ).resolves.toBeUndefined();
  });

  it("resolves without throwing when the network fails", async () => {
    server.use(http.post(TELEMETRY_URL, () => HttpResponse.error()));

    await expect(
      track("dgrep_install", "550e8400-e29b-41d4-a716-446655440000", {}),
    ).resolves.toBeUndefined();
  });

  it("no-ops when DO_NOT_TRACK=1", async () => {
    process.env.DO_NOT_TRACK = "1";
    let called = false;
    server.use(
      http.post(TELEMETRY_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_install", "550e8400-e29b-41d4-a716-446655440000", {});

    expect(called).toBe(false);
  });

  it("no-ops when DO_NOT_TRACK is any non-empty, non-'0' value", async () => {
    process.env.DO_NOT_TRACK = "true";
    let called = false;
    server.use(
      http.post(TELEMETRY_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_install", "550e8400-e29b-41d4-a716-446655440000", {});

    expect(called).toBe(false);
  });

  it("does NOT no-op when DO_NOT_TRACK='0'", async () => {
    process.env.DO_NOT_TRACK = "0";
    let called = false;
    server.use(
      http.post(TELEMETRY_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_install", "550e8400-e29b-41d4-a716-446655440000", {});

    expect(called).toBe(true);
  });

  it("no-ops when DGREP_TELEMETRY=0", async () => {
    process.env.DGREP_TELEMETRY = "0";
    let called = false;
    server.use(
      http.post(TELEMETRY_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await track("dgrep_install", "550e8400-e29b-41d4-a716-446655440000", {});

    expect(called).toBe(false);
  });
});

describe("isCI", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of CI_ENV_VARS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns false when no CI env vars are set", () => {
    expect(isCI()).toBe(false);
  });

  it("returns true when CI=true", () => {
    process.env.CI = "true";
    expect(isCI()).toBe(true);
  });

  it("returns true when GITHUB_ACTIONS is set", () => {
    process.env.GITHUB_ACTIONS = "true";
    expect(isCI()).toBe(true);
  });

  it("returns true when JENKINS_URL is set", () => {
    process.env.JENKINS_URL = "http://jenkins.example.com";
    expect(isCI()).toBe(true);
  });
});
