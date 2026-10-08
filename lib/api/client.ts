export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly retryable: boolean = false,
    readonly requestId?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === "solaflow_csrf" || name === "__Host-solaflow_csrf") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const normalizedPath = path.startsWith("/api/v1")
    ? path
    : path.startsWith("/")
    ? `/api/v1${path}`
    : `/api/v1/${path}`;

  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // 针对写操作自动注入 CSRF 头
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (
      typeof options.body === "string" ||
      options.body instanceof FormData ||
      options.body instanceof Blob
    ) {
      body = options.body as BodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(options.body);
    }
  }

  const timeoutMs = options.timeoutMs ?? 30_000;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(normalizedPath, {
      ...options,
      method,
      headers,
      body,
      signal: options.signal ?? abortController.signal,
      cache: options.cache ?? "no-store",
    });

    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      if (typeof data === "object" && data !== null && "error" in data) {
        const errObj = (data as { error: { code?: string; message?: string; details?: unknown; retryable?: boolean; requestId?: string } }).error;
        throw new ApiClientError(
          response.status,
          errObj.code || "REQUEST_FAILED",
          errObj.message || `API 请求失败 (${response.status})`,
          errObj.details,
          errObj.retryable ?? false,
          errObj.requestId
        );
      }
      throw new ApiClientError(
        response.status,
        "HTTP_ERROR",
        typeof data === "string" && data ? data : `HTTP ${response.status}`
      );
    }

    // 标准 SolaFlow API 响应包装为 { data, meta }
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as { data: T }).data;
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
