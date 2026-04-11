import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/lib/config.js", () => ({
  loadConfig: vi.fn().mockResolvedValue({}),
  saveConfig: vi.fn(),
  configPath: vi.fn().mockReturnValue("/tmp/.dgrep/config.json"),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAuth", () => {
  it("returns env var when DOCFORK_API_KEY is set", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "docf_from_env");
    vi.stubEnv("DOCFORK_CABINET", "my-cabinet");

    const { resolveAuth } = await import("../../src/lib/auth.js");
    const auth = await resolveAuth();

    expect(auth.apiKey).toBe("docf_from_env");
    expect(auth.cabinet).toBe("my-cabinet");
  });

  it("prefers env var over flag", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "docf_from_env");

    const { resolveAuth } = await import("../../src/lib/auth.js");
    const auth = await resolveAuth("docf_from_flag");

    expect(auth.apiKey).toBe("docf_from_env");
  });

  it("uses flag when no env var", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "");

    const { resolveAuth } = await import("../../src/lib/auth.js");
    const auth = await resolveAuth("docf_from_flag");

    expect(auth.apiKey).toBe("docf_from_flag");
  });

  it("auto-provisions key when nothing configured", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "");

    const { resolveAuth } = await import("../../src/lib/auth.js");
    const auth = await resolveAuth();

    expect(auth.apiKey).toBe("docf_test_key_123");
  });
});
