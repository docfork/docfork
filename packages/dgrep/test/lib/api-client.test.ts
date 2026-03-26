import { describe, it, expect } from "vitest";
import { searchDocs, readUrl, searchCatalog } from "../../src/lib/api-client.js";
import { AuthError, RateLimitError, NotFoundError, NetworkError } from "../../src/lib/errors.js";
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
