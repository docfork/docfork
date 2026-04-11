export class DgrepError extends Error {
  constructor(
    message: string,
    public code: string,
    public exitCode: number
  ) {
    super(message);
    this.name = "DgrepError";
  }
}

export class AuthError extends DgrepError {
  constructor(message: string) {
    super(message, "auth_error", 3);
    this.name = "AuthError";
  }
}

export class NotFoundError extends DgrepError {
  constructor(message: string) {
    super(message, "not_found", 4);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends DgrepError {
  constructor(message: string) {
    super(message, "rate_limited", 5);
    this.name = "RateLimitError";
  }
}

export class NetworkError extends DgrepError {
  constructor(message: string) {
    super(message, "network_error", 6);
    this.name = "NetworkError";
  }
}
