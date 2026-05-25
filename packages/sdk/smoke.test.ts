// env-gated smoke test against production. exercises all 5 methods + paging.
// runs in vitest; auto-skips when DOCFORK_API_KEY isn't set so CI stays green.
//
// to run locally:
//   DOCFORK_API_KEY=docf_xxx pnpm test

import { describe, it, expect, beforeAll } from "vitest";
import { Docfork, Page, AuthenticationError } from "./src";

const apiKey = process.env.DOCFORK_API_KEY;

describe.skipIf(!apiKey)("smoke against api.docfork.com", () => {
  let docfork: Docfork;
  beforeAll(() => { docfork = new Docfork(apiKey!); }); // defer: collection runs even when skipped.

  it("libraries.search → ranked Library[]", async () => {
    const libs = await docfork.libraries.search("next");
    expect(Array.isArray(libs)).toBe(true);
    expect(libs.length).toBeGreaterThan(0);
    expect(libs[0].object).toBe("library");
    expect(libs[0].identifier).toBeTruthy();
    expect(libs[0].source.type).toMatch(/github|website/);
  });

  it("libraries.retrieve → single Library", async () => {
    const lib = await docfork.libraries.retrieve("vercel/next.js");
    expect(lib.object).toBe("library");
    expect(lib.identifier).toBe("vercel/next.js");
    expect(lib.listing).toBe("catalog");
  });

  it("libraries.versions → Page<LibraryVersion> with async iterator + request_id", async () => {
    const page = await docfork.libraries.versions("vercel/next.js", { page_size: 5 });
    expect(page).toBeInstanceOf(Page);
    expect(page.data.length).toBeGreaterThan(0);
    expect(page.request_id).not.toBe("");
    expect(page.data[0].object).toBe("library_version");

    // iterator yields at least 1
    let count = 0;
    for await (const v of page) {
      expect(v.object).toBe("library_version");
      count++;
      if (count >= 3) break;
    }
    expect(count).toBeGreaterThan(0);
  });

  it("search → SearchResponse with results + meta", async () => {
    const res = await docfork.search("middleware", { libraries: ["vercel/next.js"], limit: 3 });
    expect(res.object).toBe("search_result");
    expect(Array.isArray(res.results)).toBe(true);
    expect(res.meta.libraries.resolved).toContain("vercel/next.js");
  });

  it("read → ReadResponse from a search result url", async () => {
    const search = await docfork.search("middleware", { libraries: ["vercel/next.js"], limit: 1 });
    const url = search.results[0]?.url;
    if (!url) throw new Error("no result url to read");
    const doc = await docfork.read(url);
    expect(typeof doc.text).toBe("string");
    expect(doc.text.length).toBeGreaterThan(0);
    expect(doc.library_identifier).toBe("vercel/next.js");
  });

  it("invalid api key → AuthenticationError", async () => {
    const bad = new Docfork("docf_definitely_invalid_key");
    await expect(bad.libraries.retrieve("vercel/next.js")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

describe("construction", () => {
  it("throws when no api key resolvable", () => {
    const saved = process.env.DOCFORK_API_KEY;
    delete process.env.DOCFORK_API_KEY;
    try {
      expect(() => new Docfork()).toThrow(/Missing API key/);
    } finally {
      if (saved) process.env.DOCFORK_API_KEY = saved;
    }
  });

  it("accepts positional string", () => {
    expect(() => new Docfork("docf_test")).not.toThrow();
  });

  it("accepts options object", () => {
    expect(() => new Docfork({ apiKey: "docf_test" })).not.toThrow();
  });
});
