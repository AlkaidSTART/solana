export interface ApiErrorOptions {
  details?: unknown;
  retryable?: boolean;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly retryable: boolean;
  readonly headers: HeadersInit | undefined;

  constructor(status: number, code: string, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    this.headers = options.headers;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(500, "INTERNAL_ERROR", "Internal server error", {
    retryable: true,
  });
}
