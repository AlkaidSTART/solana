import type { ApiMeta, ApiProblem, ApiSuccess, ListData, PageInfo } from "@/types/api/common";
import type { RequestContext } from "./request";
import { toApiError } from "./errors";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const PRIVATE_NO_STORE = "private, no-store";
const SAFE_ERROR_HEADERS = new Set(["retry-after", "www-authenticate"]);
const SENSITIVE_DETAIL_KEY = /(?:token|secret|password|passwd|cookie|authorization|auth|sql|stack|query|credential|otp|api.?key|private.?key|wallet|signature|email|phone|address|message|body)/i;
const MAX_DETAIL_DEPTH = 6;
const MAX_DETAIL_OBJECT_KEYS = 50;
const MAX_DETAIL_ARRAY_ITEMS = 100;
const MAX_DETAIL_STRING_LENGTH = 256;
const MAX_DETAIL_JSON_BYTES = 8 * 1024;

export function ok<T>(context: RequestContext, data: T, init?: ResponseInit): Response {
  return jsonResponse({ data, meta: toMeta(context) }, context, init, 200);
}

export function accepted<T>(context: RequestContext, data: T, init?: ResponseInit): Response {
  return jsonResponse({ data, meta: toMeta(context) }, context, init, 202);
}

export function list<T>(
  context: RequestContext,
  items: T[],
  pageInfo: PageInfo,
  init?: ResponseInit,
): Response {
  const data: ListData<T> = { items, pageInfo };
  return jsonResponse({ data, meta: toMeta(context) }, context, init, 200);
}

export function problem(context: RequestContext, error: unknown, init?: ResponseInit): Response {
  const apiError = toApiError(error);
  const details = sanitizeErrorDetails(apiError.details);
  const body: ApiProblem = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(details === undefined ? {} : { details }),
      retryable: apiError.retryable,
      requestId: context.requestId,
    },
  };

  return jsonResponse(body, context, {
    ...init,
    headers: approvedErrorHeaders(apiError.headers, init?.headers),
  }, apiError.status);
}

export function noContent(context: RequestContext, init?: ResponseInit): Response {
  const headers = createHeaders(context, init?.headers);
  headers.delete("Content-Type");
  headers.delete("Content-Length");
  headers.delete("Transfer-Encoding");
  return new Response(null, { ...init, status: 204, headers });
}

function toMeta(context: RequestContext): ApiMeta {
  return {
    requestId: context.requestId,
    serverTime: context.serverTime,
  };
}

function jsonResponse(
  body: ApiSuccess<unknown> | ApiProblem,
  context: RequestContext,
  init: ResponseInit | undefined,
  status: number,
  extraHeaders?: HeadersInit,
): Response {
  const headers = createHeaders(context, extraHeaders, init?.headers);
  return Response.json(body, { ...init, status, headers });
}

function createHeaders(context: RequestContext, ...headerSets: (HeadersInit | undefined)[]): Headers {
  const headers = new Headers();
  for (const headerSet of headerSets) {
    if (headerSet) {
      new Headers(headerSet).forEach((value, name) => headers.set(name, value));
    }
  }

  headers.set("Content-Type", JSON_CONTENT_TYPE);
  headers.set("X-Request-ID", context.requestId);
  headers.set("Cache-Control", PRIVATE_NO_STORE);
  return headers;
}

function approvedErrorHeaders(...headerSets: (HeadersInit | undefined)[]): Headers {
  const headers = new Headers();
  for (const headerSet of headerSets) {
    if (!headerSet) {
      continue;
    }

    let candidateHeaders: Headers;
    try {
      candidateHeaders = new Headers(headerSet);
    } catch {
      continue;
    }

    candidateHeaders.forEach((value, name) => {
      if (SAFE_ERROR_HEADERS.has(name.toLowerCase()) && value.length <= 512) {
        headers.set(name, value);
      }
    });
  }
  return headers;
}

function sanitizeErrorDetails(value: unknown): unknown | undefined {
  try {
    const sanitized = sanitizeErrorDetail(value, 0, new WeakSet<object>());
    if (sanitized === undefined) {
      return undefined;
    }

    const serialized = JSON.stringify(sanitized);
    if (serialized === undefined || new TextEncoder().encode(serialized).byteLength > MAX_DETAIL_JSON_BYTES) {
      return undefined;
    }
    return sanitized;
  } catch {
    return undefined;
  }
}

function sanitizeErrorDetail(value: unknown, depth: number, seen: WeakSet<object>): unknown | undefined {
  if (depth > MAX_DETAIL_DEPTH) {
    return undefined;
  }
  if (value === null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    return value.length <= MAX_DETAIL_STRING_LENGTH ? value : undefined;
  }
  if (typeof value !== "object") {
    return undefined;
  }
  if (seen.has(value)) {
    return undefined;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    if (value.length > MAX_DETAIL_ARRAY_ITEMS) {
      return undefined;
    }
    const sanitizedItems: unknown[] = [];
    for (const item of value) {
      const sanitizedItem = sanitizeErrorDetail(item, depth + 1, seen);
      if (sanitizedItem === undefined) {
        return undefined;
      }
      sanitizedItems.push(sanitizedItem);
    }
    return sanitizedItems;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if ((prototype !== Object.prototype && prototype !== null) || keys.length > MAX_DETAIL_OBJECT_KEYS) {
    return undefined;
  }

  const sanitizedObject: Record<string, unknown> = {};
  for (const key of keys) {
    if (key.length > 128 || SENSITIVE_DETAIL_KEY.test(key)) {
      return undefined;
    }
    const descriptor = descriptors[key];
    if (!descriptor?.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, "value")) {
      return undefined;
    }
    const entry: unknown = descriptor.value;
    const sanitizedEntry = sanitizeErrorDetail(entry, depth + 1, seen);
    if (sanitizedEntry === undefined) {
      return undefined;
    }
    sanitizedObject[key] = sanitizedEntry;
  }

  return sanitizedObject;
}
