import { beforeEach, describe, expect, it, vi } from "vitest";

import { tenant } from "@/tests/support/payment-fixtures";

const mocks = vi.hoisted(() => ({ query: vi.fn(), get: vi.fn(), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }));
vi.mock("./database", () => ({ database: () => ({ query: mocks.query, transaction: <T>(fn: (db: { query: typeof mocks.query }) => Promise<T>) => fn({ query: mocks.query }) }) }));
import { assertOrigin, createLocalSession, paymentResponse, readBody, tenantSession } from "./http";
import { paymentConfig } from "./config";
import { GET as getOrder, PATCH as patchOrder, DELETE as deleteOrder } from "@/app/api/v1/payments/orders/[id]/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("PAYMENTS_ALLOW_LOCAL_SESSION", "true");
  vi.stubEnv("DATABASE_URL", "postgresql://test@localhost/test"); vi.stubEnv("SOLANA_RECIPIENT", "11111111111111111111111111111111"); vi.stubEnv("PAYMENT_APP_ORIGIN", "http://localhost:3000");
  mocks.query.mockResolvedValue({ rows: [] });
});
const request = (origin = "http://localhost:3000") => new Request("http://localhost:3000/api/v1/payments/session", { method: "POST", headers: { origin } });
describe("payment HTTP security", () => {
  it("requires explicit enablement and forbids production", () => {
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "false"); expect(paymentConfig).toThrow();
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("NODE_ENV", "production"); expect(paymentConfig).toThrow();
  });
  it("blocks session reads before database access when disabled or in production", async () => {
    mocks.get.mockReturnValue({ value: "a".repeat(64) });
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "false");
    await expect(tenantSession()).rejects.toThrow("disabled");
    vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("NODE_ENV", "production");
    await expect(tenantSession()).rejects.toThrow("disabled");
    expect(mocks.query).not.toHaveBeenCalled();
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
  it("cancels awaiting_payment order via PATCH and rejects non-awaiting_payment", async () => {
    mocks.get.mockReturnValue({ value: "a".repeat(64) });
    const order = { id: "22222222-2222-4222-8222-222222222222", tenantId: tenant, network: "devnet", reference: "11111111111111111111111111111111", recipient: "11111111111111111111111111111111", recipientAta: "11111111111111111111111111111111", mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", amountAtomic: "2000000", credits: 100, priceVersion: "credits-2026-10-07", createdAt: "2026-10-07T00:00:00.000Z", expiresAt: "2026-10-07T00:20:00.000Z", status: "awaiting_payment", signature: null };
    mocks.query
      .mockResolvedValueOnce({ rows: [{ tenant_id: tenant }] }) // session
      .mockResolvedValueOnce({ rows: [order] }) // get order
      .mockResolvedValueOnce({ rows: [{ ...order, status: "cancelled" }] }); // cancel query
    const patchReq = new Request("http://localhost:3000/api/v1/payments/orders/22222222-2222-4222-8222-222222222222", {
      method: "PATCH",
      headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const res = await patchOrder(patchReq, { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);
    const data = await res.json() as { order: { status: string } };
    expect(data.order.status).toBe("cancelled");

    // Rejects cancelling an already credited order
    mocks.query
      .mockResolvedValueOnce({ rows: [{ tenant_id: tenant }] })
      .mockResolvedValueOnce({ rows: [{ ...order, status: "credited" }] });
    const patchReq2 = new Request("http://localhost:3000/api/v1/payments/orders/22222222-2222-4222-8222-222222222222", {
      method: "PATCH",
      headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const res2 = await patchOrder(patchReq2, { params: Promise.resolve({ id: order.id }) });
    expect(res2.status).toBe(400);
  });
  it("deletes uncredited order via DELETE and rejects credited/confirmed orders", async () => {
    mocks.get.mockReturnValue({ value: "a".repeat(64) });
    const order = { id: "22222222-2222-4222-8222-222222222222", tenantId: tenant, network: "devnet", reference: "11111111111111111111111111111111", recipient: "11111111111111111111111111111111", recipientAta: "11111111111111111111111111111111", mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", amountAtomic: "2000000", credits: 100, priceVersion: "credits-2026-10-07", createdAt: "2026-10-07T00:00:00.000Z", expiresAt: "2026-10-07T00:20:00.000Z", status: "awaiting_payment", signature: null };
    mocks.query
      .mockResolvedValueOnce({ rows: [{ tenant_id: tenant }] }) // session
      .mockResolvedValueOnce({ rows: [order] }) // load
      .mockResolvedValueOnce({ rows: [{ status: "awaiting_payment" }] }) // repository.delete status query
      .mockResolvedValueOnce({ rows: [] }) // candidate delete
      .mockResolvedValueOnce({ rowCount: 1 }); // order delete
    const deleteReq = new Request("http://localhost:3000/api/v1/payments/orders/22222222-2222-4222-8222-222222222222", {
      method: "DELETE",
      headers: { origin: "http://localhost:3000" },
    });
    const res = await deleteOrder(deleteReq, { params: Promise.resolve({ id: order.id }) });
    expect(res.status).toBe(200);
    const data = await res.json() as { success: boolean; id: string };
    expect(data.success).toBe(true);

    // Rejects deleting credited order
    mocks.query
      .mockResolvedValueOnce({ rows: [{ tenant_id: tenant }] })
      .mockResolvedValueOnce({ rows: [{ ...order, status: "credited" }] });
    const deleteReq2 = new Request("http://localhost:3000/api/v1/payments/orders/22222222-2222-4222-8222-222222222222", {
      method: "DELETE",
      headers: { origin: "http://localhost:3000" },
    });
    const res2 = await deleteOrder(deleteReq2, { params: Promise.resolve({ id: order.id }) });
    expect(res2.status).toBe(400);
  });
});
