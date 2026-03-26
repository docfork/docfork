import { describe, it, expect } from "vitest";
import {
  DgrepError,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
} from "../../src/lib/errors.js";

describe("DgrepError", () => {
  it("has correct code and exitCode", () => {
    const err = new DgrepError("test", "test_code", 42);
    expect(err.message).toBe("test");
    expect(err.code).toBe("test_code");
    expect(err.exitCode).toBe(42);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("AuthError", () => {
  it("has exit code 3", () => {
    const err = new AuthError("bad key");
    expect(err.code).toBe("auth_error");
    expect(err.exitCode).toBe(3);
    expect(err).toBeInstanceOf(DgrepError);
  });
});

describe("NotFoundError", () => {
  it("has exit code 4", () => {
    const err = new NotFoundError("not found");
    expect(err.code).toBe("not_found");
    expect(err.exitCode).toBe(4);
  });
});

describe("RateLimitError", () => {
  it("has exit code 5", () => {
    const err = new RateLimitError("rate limited");
    expect(err.code).toBe("rate_limited");
    expect(err.exitCode).toBe(5);
  });
});

describe("NetworkError", () => {
  it("has exit code 6", () => {
    const err = new NetworkError("offline");
    expect(err.code).toBe("network_error");
    expect(err.exitCode).toBe(6);
  });
});
