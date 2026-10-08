import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiFetch, ApiClientError } from "./client";

describe("apiFetch client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes path with /api/v1 prefix and parses successful json response", async () => {
    const mockData = { id: "test-1", name: "Store 1" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ data: mockData, meta: { requestId: "r-1", serverTime: "2026-10-08" } }),
    } as unknown as Response);

    const result = await apiFetch<typeof mockData>("stores");
    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/stores",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      })
    );
  });

  it("unwraps ApiProblem error and throws ApiClientError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
          retryable: false,
          requestId: "req-err-1",
        },
      }),
    } as unknown as Response);

    await expect(apiFetch("auth/session")).rejects.toThrow(ApiClientError);
    await expect(apiFetch("auth/session")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required",
    });
  });

  it("handles 204 No Content returning null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as unknown as Response);

    const result = await apiFetch<null>("auth/logout", { method: "POST" });
    expect(result).toBeNull();
  });
});
