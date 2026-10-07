import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createRequestContext, parseJson, readRawBody } from "./request";
import { ApiError } from "./errors";
import { ok, problem } from "./responses";

describe("shared HTTP contract", () => {
  it("reuses a safe request ID and replaces an unsafe one", () => {
    const safe = createRequestContext(
      new Request("https://solaflow.test/api/v1/health", {
        headers: { "X-Request-ID": "req_abc-123" },
      }),
    );
    const unsafe = createRequestContext(
      new Request("https://solaflow.test/api/v1/health", {
        headers: { "X-Request-ID": "bad request id" },
      }),
    );

    expect(safe.requestId).toBe("req_abc-123");
    expect(unsafe.requestId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("returns a success envelope with request metadata and private no-store headers", async () => {
    const context = createRequestContext(
      new Request("https://solaflow.test/api/v1/health", {
        headers: { "X-Request-ID": "req_health-1" },
      }),
    );

    const response = ok(context, { status: "ok" });
    const body = await response.json();

    expect(response.headers.get("X-Request-ID")).toBe("req_health-1");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body).toMatchObject({
      data: { status: "ok" },
      meta: { requestId: "req_health-1" },
    });
    expect(typeof body.meta.serverTime).toBe("string");
  });

  it("rejects non-JSON request content types with a stable API error", async () => {
    const request = new Request("https://solaflow.test/api/v1/example", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "{}",
    });

    await expect(parseJson(request, z.object({ value: z.string() }))).rejects.toMatchObject({
      status: 400,
      code: "INVALID_CONTENT_TYPE",
    });
  });

  it("maps schema violations to a safe 422 API error", async () => {
    const request = new Request("https://solaflow.test/api/v1/example", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: 42 }),
    });

    await expect(parseJson(request, z.object({ value: z.string() }))).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_FAILED",
      retryable: false,
    });
  });

  it("stops reading a body when the byte limit is exceeded", async () => {
    const request = new Request("https://solaflow.test/api/v1/webhook", {
      method: "POST",
      body: "12345",
    });

    await expect(readRawBody(request, 4)).rejects.toMatchObject({
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  it("omits sensitive error details and forwards only approved error headers", async () => {
    const context = createRequestContext(new Request("https://solaflow.test/api/v1/example"));
    const response = problem(context, new ApiError(503, "UPSTREAM_UNAVAILABLE", "Provider unavailable", {
      details: { nested: { accessToken: "must-not-leak" } },
      headers: {
        "Retry-After": "30",
        "Set-Cookie": "session=must-not-leak",
        "X-Upstream-Token": "must-not-leak",
      },
    }));
    const body = await response.json();

    expect(body.error).not.toHaveProperty("details");
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(response.headers.get("Set-Cookie")).toBeNull();
    expect(response.headers.get("X-Upstream-Token")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
