// error envelope { error: { type, code, message, request_id } } → typed subclass per status family.

export interface DocforkErrorBody {
  type: string;
  code: string;
  message: string;
  param?: string;
  request_id?: string;
}

export class DocforkError extends Error {
  readonly status: number;
  readonly type: string;
  readonly code: string;
  readonly requestId: string | null;
  readonly response?: Response;

  constructor(
    message: string,
    init: {
      status: number;
      type: string;
      code: string;
      requestId?: string | null;
      response?: Response;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = init.status;
    this.type = init.type;
    this.code = init.code;
    this.requestId = init.requestId ?? null;
    this.response = init.response;
  }
}

export class AuthenticationError extends DocforkError {} // 401
export class InvalidRequestError extends DocforkError {} // 400
export class RateLimitError extends DocforkError {} // 402, 429
export class APIError extends DocforkError {} // 5xx + anything unmapped

function pickSubclass(status: number): typeof DocforkError {
  if (status === 401) return AuthenticationError;
  if (status === 400) return InvalidRequestError;
  if (status === 402 || status === 429) return RateLimitError;
  return APIError;
}

// heyapi error interceptor: returned instance is thrown when throwOnError:true on the client.
export const wrapClientError = (
  error: unknown,
  response: Response | undefined,
  _request: Request | undefined,
  _options: unknown,
): unknown => {
  // network failure: no response object.
  if (!response) {
    if (error instanceof DocforkError) return error;
    return new APIError(
      error instanceof Error ? error.message : "Network error",
      { status: 0, type: "api_error", code: "network_error" },
    );
  }

  const status = response.status;
  const requestId = response.headers.get("request-id");
  const body = (error ?? {}) as { error?: Partial<DocforkErrorBody> };
  const envelope: Partial<DocforkErrorBody> = body.error ?? {};

  const Subclass = pickSubclass(status);
  return new Subclass(envelope.message ?? `HTTP ${status}`, {
    status,
    type: envelope.type ?? "api_error",
    code: envelope.code ?? `http_${status}`,
    requestId: envelope.request_id ?? requestId,
    response,
  });
};
