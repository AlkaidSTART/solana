import { randomUUID } from "node:crypto";

import { z } from "zod";

import { ApiError } from "./errors";

const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export interface RequestContext {
  requestId: string;
  serverTime: string;
}

export function createRequestContext(request: Request): RequestContext {
  const suppliedRequestId = request.headers.get("X-Request-ID")?.trim();
  const requestId = suppliedRequestId && REQUEST_ID_PATTERN.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID();

  return {
    requestId,
    serverTime: new Date().toISOString(),
  };
}

export async function parseJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<z.output<TSchema>> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }

  const contentType = request.headers.get("Content-Type");
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new ApiError(400, "INVALID_CONTENT_TYPE", "Content-Type must be application/json");
  }

  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the allowed size");
  }

  const bytes = await readRawBody(request, maxBytes);
  let payload: unknown;

  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must contain valid JSON");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(422, "VALIDATION_FAILED", "Request body did not match the required schema", {
      details: {
        issues: result.error.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: issue.path,
        })),
      },
    });
  }

  return result.data;
}

export function requireHeader(request: Request, name: string): string {
  const value = request.headers.get(name)?.trim();
  if (!value) {
    throw new ApiError(400, "MISSING_REQUIRED_HEADER", `Missing required header: ${name}`);
  }

  return value;
}

export async function readRawBody(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the allowed size");
  }
  if (!request.body) {
    return new Uint8Array();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the allowed size");
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}
