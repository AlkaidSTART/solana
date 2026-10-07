import { beforeEach, describe, expect, it, vi } from "vitest";

import { tenant } from "@/tests/support/payment-fixtures";

const mocks = vi.hoisted(() => ({ query: vi.fn(), get: vi.fn(), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("./database", () => ({ database: () => ({ query: mocks.query }) }));
import { assertOrigin, createLocalSession, paymentResponse, readBody, tenantSession } from "./http";
import { paymentConfig } from "./config";
import { GET as getOrder } from "@/app/api/payments/orders/[id]/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("PAYMENTS_ALLOW_LOCAL_SESSION", "true");
  vi.stubEnv("DATABASE_URL", "postgresql://test@localhost/test"); vi.stubEnv("SOLANA_RECIPIENT", "11111111111111111111111111111111"); vi.stubEnv("PAYMENT_APP_ORIGIN", "http://localhost:3000");
  mocks.query.mockResolvedValue({ rows: [] });
});
const request = (origin = "http://localhost:3000") => new Request("http://localhost:3000/api/payments/session", { method: "POST", headers: { origin } });
describe("payment HTTP security", () => {
  it("requires explicit enablement and forbids production", () => {
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "false"); expect(paymentConfig).toThrow();
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("NODE_ENV", "production"); expect(paymentConfig).toThrow();
  });
  it("rejects foreign or missing origins", () => {
    expect(() => assertOrigin(request("https://attacker.invalid"))).toThrow();
    expect(() => assertOrigin(new Request("http://localhost:3000"))).toThrow();
  });
  it("requires live server session and ignores client-supplied tenant", async () => {
    await expect(tenantSession()).rejects.toMatchObject({ status: 401 });
    mocks.get.mockReturnValue({ value: "x" }); await expect(tenantSession()).rejects.toMatchObject({ status: 401 });
    mocks.get.mockReturnValue({ value: "a".repeat(64) }); await expect(tenantSession()).rejects.toMatchObject({ status: 401 });
    mocks.query.mockResolvedValue({ rows: [{ tenant_id: tenant }] }); expect(await tenantSession()).toBe(tenant);
    expect(mocks.query.mock.lastCall?.[1][0]).not.toBe("a".repeat(64));
  });
  it("sets an HttpOnly strict cookie and reuses an existing tenant", async () => {
    const created = await createLocalSession(request()); expect(created).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.set).toHaveBeenCalledWith("solaflow_devnet_session", expect.any(String), expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/" }));
    mocks.get.mockReturnValue({ value: "a".repeat(64) }); mocks.query.mockResolvedValue({ rows: [{ tenant_id: tenant }] });
    expect(await createLocalSession(request())).toBe(tenant); expect(mocks.set).toHaveBeenCalledTimes(1);
  });
  it("disallows remote session creation and disabled local mode", async () => {
    await expect(createLocalSession(new Request("http://remote.invalid/api", { headers: { origin: "http://localhost:3000" } }))).rejects.toMatchObject({ status: 403 });
    vi.stubEnv("PAYMENTS_ALLOW_LOCAL_SESSION", "false"); await expect(createLocalSession(request())).rejects.toMatchObject({ status: 403 });
  });
  it("does not leak a foreign order", async () => {
    mocks.get.mockReturnValue({ value: "a".repeat(64) });
    mocks.query.mockResolvedValueOnce({ rows: [{ tenant_id: tenant }] }).mockResolvedValueOnce({ rows: [] });
    const response = await getOrder(request(), { params: Promise.resolve({ id: "22222222-2222-4222-8222-222222222222" }) });
    expect(response.status).toBe(404); expect(mocks.query.mock.lastCall?.[1]).toEqual(["22222222-2222-4222-8222-222222222222", tenant]);
  });
  it("rejects content type, malformed and oversized JSON", async () => {
    await expect(readBody(request())).rejects.toMatchObject({ status: 415 });
    for (const [body, status] of [["{", 400], ["x".repeat(2049), 413]] as const) await expect(readBody(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body }))).rejects.toMatchObject({ status });
  });
  it("fails closed and hides connection details in service errors", async () => {
    const response = await paymentResponse(async () => { throw new Error("postgres://secret:password@example.invalid"); });
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("password");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
