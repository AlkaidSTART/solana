import { describe, expect, it } from "vitest";
import { hasPermission, requireRole } from "@/lib/server/auth/roles";
import { assertCsrf } from "@/lib/server/auth/csrf";
import { createPayloadDigest } from "@/lib/server/idempotency/service";
import { hmacSha256Hex } from "@/lib/server/security/digests";
import { appendSetCookies } from "@/lib/server/services/auth/service";

const CSRF_TEST_KEY = "test-csrf-signing-key-that-is-at-least-32-bytes";

describe("auth and idempotency rules", () => {
  it("allows only explicitly permitted roles", () => {
    const actor = {
      userId: "user-1",
      tenantId: "tenant-1",
      membershipId: "membership-1",
      role: "Admin" as const,
      storeIds: [],
      sessionId: "session-1",
      csrfTokenHash: "hash",
    };

    expect(requireRole(actor, ["Admin", "Owner"])).toBe(actor);
    expect(() => requireRole(actor, ["Finance"])).toThrow();
    expect(hasPermission("Admin", "stores:configure")).toBe(true);
    expect(hasPermission("Admin", "stores:unlink")).toBe(false);
  });

  it("accepts a CSRF token only when origin, cookie, header, and session hash agree", async () => {
    const request = new Request("https://console.example.test/api/v1/tenant", {
      method: "PATCH",
      headers: {
        origin: "https://console.example.test",
        cookie: "solaflow_csrf=csrf-token; __Host-solaflow_csrf=csrf-token",
        "x-csrf-token": "csrf-token",
      },
    });

    await expect(assertCsrf(request, hmacSha256Hex(CSRF_TEST_KEY, "csrf-token"), {
      allowedOrigins: ["https://console.example.test"],
      signingKey: CSRF_TEST_KEY,
    })).resolves.toBeUndefined();
  });

  it("rejects CSRF cookie and header disagreement", async () => {
    const request = new Request("https://console.example.test/api/v1/tenant", {
      method: "PATCH",
      headers: {
        origin: "https://console.example.test",
        cookie: "solaflow_csrf=cookie-token; __Host-solaflow_csrf=cookie-token",
        "x-csrf-token": "header-token",
      },
    });

    await expect(assertCsrf(request, hmacSha256Hex(CSRF_TEST_KEY, "cookie-token"), {
      allowedOrigins: ["https://console.example.test"],
      signingKey: CSRF_TEST_KEY,
    })).rejects.toThrow();
  });

  it("hashes structurally equivalent JSON payloads consistently", () => {
    expect(createPayloadDigest({ amount: "25", locale: "id_ID" })).toBe(
      createPayloadDigest({ locale: "id_ID", amount: "25" }),
    );
    expect(createPayloadDigest({ amount: "25", locale: "id_ID" })).not.toBe(
      createPayloadDigest({ amount: "50", locale: "id_ID" }),
    );
  });

  it("appends both auth cookies without placing either value in the response body", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    appendSetCookies(response, ["session-cookie=opaque", "csrf-cookie=readable"]);

    expect(response.headers.get("Set-Cookie")).toContain("session-cookie=opaque");
    expect(response.headers.get("Set-Cookie")).toContain("csrf-cookie=readable");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
