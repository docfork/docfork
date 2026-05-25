// unit: wrapClientError envelope → typed subclass mapping. no network.

import { describe, it, expect } from "vitest";
import {
  wrapClientError,
  DocforkError,
  AuthenticationError,
  InvalidRequestError,
  RateLimitError,
  APIError,
} from "./errors";

function res(status: number, requestId = "req_abc"): Response {
  return new Response(null, { status, headers: { "request-id": requestId } });
}

function envelope(type: string, code: string, message: string) {
  return { error: { type, code, message, request_id: "req_envelope" } };
}

describe("wrapClientError", () => {
  it("401 → AuthenticationError with envelope fields", () => {
    const out = wrapClientError(
      envelope("authentication_error", "invalid_api_key", "bad key"),
      res(401),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(AuthenticationError);
    expect(out).toBeInstanceOf(DocforkError);
    const err = out as AuthenticationError;
    expect(err.status).toBe(401);
    expect(err.code).toBe("invalid_api_key");
    expect(err.type).toBe("authentication_error");
    expect(err.message).toBe("bad key");
    expect(err.requestId).toBe("req_envelope"); // envelope wins over header
  });

  it("400 → InvalidRequestError", () => {
    const out = wrapClientError(
      envelope("invalid_request_error", "missing_param", "libraries required"),
      res(400),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(InvalidRequestError);
  });

  it("402 → RateLimitError (quota_exhausted)", () => {
    const out = wrapClientError(
      envelope("rate_limit_error", "quota_exhausted", "out of credits"),
      res(402),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(RateLimitError);
    expect((out as RateLimitError).status).toBe(402);
  });

  it("429 → RateLimitError (rate-limited)", () => {
    const out = wrapClientError(
      envelope("rate_limit_error", "rate_limited", "slow down"),
      res(429),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(RateLimitError);
  });

  it("500 → APIError (server error)", () => {
    const out = wrapClientError(
      envelope("api_error", "internal", "boom"),
      res(500),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(APIError);
  });

  it("unknown status → APIError fallback", () => {
    const out = wrapClientError(
      envelope("api_error", "weird", "?"),
      res(418),
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(APIError);
  });

  it("falls back to Request-Id header when envelope.request_id missing", () => {
    const out = wrapClientError(
      { error: { type: "api_error", code: "x", message: "y" } },
      res(500, "req_header"),
      undefined,
      {},
    );
    expect((out as DocforkError).requestId).toBe("req_header");
  });

  it("missing envelope → still typed by status code", () => {
    const out = wrapClientError(null, res(401), undefined, {});
    expect(out).toBeInstanceOf(AuthenticationError);
    expect((out as DocforkError).type).toBe("api_error"); // default type
    expect((out as DocforkError).code).toBe("http_401"); // default code
  });

  it("network failure (no response) → APIError", () => {
    const out = wrapClientError(
      new Error("ECONNREFUSED"),
      undefined,
      undefined,
      {},
    );
    expect(out).toBeInstanceOf(APIError);
    expect((out as DocforkError).status).toBe(0);
    expect((out as DocforkError).code).toBe("network_error");
  });

  it("network failure passthrough when error is already DocforkError", () => {
    const inner = new AuthenticationError("x", {
      status: 401,
      type: "authentication_error",
      code: "c",
    });
    const out = wrapClientError(inner, undefined, undefined, {});
    expect(out).toBe(inner);
  });
});
