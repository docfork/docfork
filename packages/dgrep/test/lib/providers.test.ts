import { describe, it, expect } from "vitest";
import { resolveSource } from "../../src/lib/providers.js";

describe("resolveSource", () => {
  it("resolves simple name to catalog", () => {
    expect(resolveSource("react")).toEqual({ type: "catalog", identifier: "react" });
  });

  it("resolves owner/repo to github", () => {
    expect(resolveSource("vercel/next.js")).toEqual({
      type: "github",
      identifier: "vercel/next.js",
    });
  });

  it("resolves HTTP URL to url", () => {
    expect(resolveSource("https://docs.example.com")).toEqual({
      type: "url",
      identifier: "https://docs.example.com",
    });
  });

  it("resolves http URL to url", () => {
    expect(resolveSource("http://localhost:3000/docs")).toEqual({
      type: "url",
      identifier: "http://localhost:3000/docs",
    });
  });

  it("resolves scoped name to catalog", () => {
    expect(resolveSource("nextjs")).toEqual({ type: "catalog", identifier: "nextjs" });
  });
});
