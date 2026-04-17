import { describe, it, expect } from "vitest";
import {
  searchDocs,
  readUrl,
  searchCatalog,
  batchSearchDocs,
  resolvePackages,
  provisionKey,
} from "../../src/lib/api-client.js";
import { AuthError, RateLimitError, NotFoundError, NetworkError } from "../../src/lib/errors.js";
import { VERSION } from "../../src/lib/version.js";
import { server } from "../setup.js";
import { http, HttpResponse } from "msw";

const API_URL = "https://api.docfork.com/v1";

describe("searchDocs", () => {
  it("returns search results", async () => {
    const result = await searchDocs("hooks", "react");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe("useState");
  });

  it("throws AuthError on 401", async () => {
    server.use(
      http.get(`${API_URL}/search`, () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    await expect(searchDocs("hooks", "react")).rejects.toThrow(AuthError);
  });

  it("throws RateLimitError on 429", async () => {
    server.use(
      http.get(`${API_URL}/search`, () => {
        return new HttpResponse(null, { status: 429 });
      }),
    );

    await expect(searchDocs("hooks", "react")).rejects.toThrow(RateLimitError);
  });

  it("throws NotFoundError on 404", async () => {
    server.use(
      http.get(`${API_URL}/search`, () => {
        return new HttpResponse("Library not found", { status: 404 });
      }),
    );

    await expect(searchDocs("hooks", "react")).rejects.toThrow(NotFoundError);
  });
});

describe("readUrl", () => {
  it("returns doc content", async () => {
    const result = await readUrl("https://react.dev/reference/react/useState");
    expect(result.text).toContain("useState");
    expect(result.library_identifier).toBe("facebook/react");
  });
});

describe("searchCatalog", () => {
  it("returns catalog libraries", async () => {
    const result = await searchCatalog("react");
    expect(result.libraries).toHaveLength(1);
    expect(result.libraries[0].identifier).toBe("facebook/react");
  });
});

describe("X-Docfork-Client header", () => {
  const expected = `dgrep/${VERSION}`;

  async function captureClientHeader(
    path: string,
    method: "get" | "post",
    trigger: () => Promise<unknown>,
  ): Promise<string | null> {
    let header: string | null = null;
    server.use(
      http[method](`${API_URL}${path}`, ({ request }) => {
        header = request.headers.get("x-docfork-client");
        return HttpResponse.json({});
      }),
    );
    await trigger().catch(() => {
      // handler returns {} — some callers may throw on shape, ignore for header check
    });
    return header;
  }

  it("sends the header on GET /search", async () => {
    const header = await captureClientHeader("/search", "get", () =>
      searchDocs("hooks", "react"),
    );
    expect(header).toBe(expected);
  });

  it("sends the header on POST /search", async () => {
    const header = await captureClientHeader("/search", "post", () =>
      batchSearchDocs("hooks", ["react@latest"]),
    );
    expect(header).toBe(expected);
  });

  it("sends the header on GET /read", async () => {
    const header = await captureClientHeader("/read", "get", () =>
      readUrl("https://react.dev/reference/react/useState"),
    );
    expect(header).toBe(expected);
  });

  it("sends the header on GET /libraries/search", async () => {
    const header = await captureClientHeader("/libraries/search", "get", () =>
      searchCatalog("react"),
    );
    expect(header).toBe(expected);
  });

  it("sends the header on POST /libraries/resolve", async () => {
    const header = await captureClientHeader("/libraries/resolve", "post", () =>
      resolvePackages(["react"]),
    );
    expect(header).toBe(expected);
  });

  it("sends the header on POST /keys/provision", async () => {
    const header = await captureClientHeader("/keys/provision", "post", () => provisionKey());
    expect(header).toBe(expected);
  });
});
