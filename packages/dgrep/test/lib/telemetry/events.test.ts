import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import {
  captureInstall,
  captureCommandExecuted,
  captureError,
} from "../../../src/lib/telemetry/events.js";
import { server } from "../../setup.js";

const TELEMETRY_URL = "https://api.docfork.com/v1/telemetry";
const INSTALL_ID = "550e8400-e29b-41d4-a716-446655440000";

interface CapturedPayload {
  event: string;
  distinct_id: string;
  properties: Record<string, unknown>;
}

function captureOnce(): () => CapturedPayload | null {
  let received: CapturedPayload | null = null;
  server.use(
    http.post(TELEMETRY_URL, async ({ request }) => {
      received = (await request.json()) as CapturedPayload;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return () => received;
}

describe("captureInstall", () => {
  // env-var opt-out tests live in transport.test.ts; here we only exercise
  // the event shape, so clear both vars to avoid interference.
  const saved = { DO_NOT_TRACK: process.env.DO_NOT_TRACK, DGREP_TELEMETRY: process.env.DGREP_TELEMETRY };
  beforeEach(() => {
    delete process.env.DO_NOT_TRACK;
    delete process.env.DGREP_TELEMETRY;
  });
  afterEach(() => {
    if (saved.DO_NOT_TRACK !== undefined) process.env.DO_NOT_TRACK = saved.DO_NOT_TRACK;
    if (saved.DGREP_TELEMETRY !== undefined) process.env.DGREP_TELEMETRY = saved.DGREP_TELEMETRY;
  });

  it("emits a dgrep_install event with the install props shape", async () => {
    const get = captureOnce();
    await captureInstall(INSTALL_ID, {
      os: "darwin",
      arch: "arm64",
      node_version: "22.11.0",
      dgrep_version: "0.2.0",
      install_id: INSTALL_ID,
      ci: false,
    });
    expect(get()).toEqual({
      event: "dgrep_install",
      distinct_id: INSTALL_ID,
      properties: {
        os: "darwin",
        arch: "arm64",
        node_version: "22.11.0",
        dgrep_version: "0.2.0",
        install_id: INSTALL_ID,
        ci: false,
      },
    });
  });

  it("resolves when the server errors", async () => {
    server.use(http.post(TELEMETRY_URL, () => new HttpResponse(null, { status: 500 })));
    await expect(
      captureInstall(INSTALL_ID, {
        os: "linux",
        arch: "x64",
        node_version: "22.11.0",
        dgrep_version: "0.2.0",
        install_id: INSTALL_ID,
        ci: true,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("captureCommandExecuted", () => {
  beforeEach(() => {
    delete process.env.DO_NOT_TRACK;
    delete process.env.DGREP_TELEMETRY;
  });

  it("emits a dgrep_command_executed event with the command props shape", async () => {
    const get = captureOnce();
    await captureCommandExecuted(INSTALL_ID, {
      command: "search",
      success: true,
      exit_code: 0,
      latency_ms: 123,
      flag_count: 2,
      json_mode: false,
      authenticated: true,
      dgrep_version: "0.2.0",
      node_version: "22.11.0",
      os: "darwin",
    });
    expect(get()).toEqual({
      event: "dgrep_command_executed",
      distinct_id: INSTALL_ID,
      properties: {
        command: "search",
        success: true,
        exit_code: 0,
        latency_ms: 123,
        flag_count: 2,
        json_mode: false,
        authenticated: true,
        dgrep_version: "0.2.0",
        node_version: "22.11.0",
        os: "darwin",
      },
    });
  });

  it("resolves when the network fails", async () => {
    server.use(http.post(TELEMETRY_URL, () => HttpResponse.error()));
    await expect(
      captureCommandExecuted(INSTALL_ID, {
        command: "read",
        success: false,
        exit_code: 1,
        latency_ms: 50,
        flag_count: 0,
        json_mode: true,
        authenticated: false,
        dgrep_version: "0.2.0",
        node_version: "22.11.0",
        os: "linux",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("captureError", () => {
  beforeEach(() => {
    delete process.env.DO_NOT_TRACK;
    delete process.env.DGREP_TELEMETRY;
  });

  it("emits a dgrep_error event with the error props shape", async () => {
    const get = captureOnce();
    await captureError(INSTALL_ID, {
      command: "search",
      error_class: "NetworkError",
      exit_code: 1,
      dgrep_version: "0.2.0",
      node_version: "22.11.0",
      os: "darwin",
    });
    expect(get()).toEqual({
      event: "dgrep_error",
      distinct_id: INSTALL_ID,
      properties: {
        command: "search",
        error_class: "NetworkError",
        exit_code: 1,
        dgrep_version: "0.2.0",
        node_version: "22.11.0",
        os: "darwin",
      },
    });
  });
});
