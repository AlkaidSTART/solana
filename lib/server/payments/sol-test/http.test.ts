import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEVNET_GENESIS } from "@/lib/payments/contracts";
import { solTestCheckoutSchema } from "@/lib/payments/sol-test/contracts";
import { testAddress, testSignature } from "@/tests/support/sol-test-fixtures";
import { solTestRequest } from "./http";

const rpc = vi.hoisted(() => ({ genesis: vi.fn(), transaction: vi.fn() }));
const auth = vi.hoisted(() => ({ requireActor: vi.fn() }));
vi.mock("../rpc", () => ({ paymentChain: () => rpc }));
vi.mock("@/lib/server/auth/session", () => ({ requireActor: auth.requireActor }));
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "true"); vi.stubEnv("SOLANA_RECIPIENT", testAddress(2));
  vi.stubEnv("PAYMENT_APP_ORIGIN", "http://localhost:3000"); vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
  rpc.genesis.mockResolvedValue(DEVNET_GENESIS); rpc.transaction.mockResolvedValue(null);
  auth.requireActor.mockResolvedValue({ userId: "33333333-3333-4333-8333-333333333333", tenantId: "11111111-1111-4111-8111-111111111111" });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
function request(body?: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/v1/payments/sol-test/check", { method: "POST", headers: { origin }, body: body === undefined ? undefined : JSON.stringify(body) });
}
describe("local Devnet SOL API boundary", () => {
  it("blocks production without the explicit opt-in and disabled mode before any RPC", async () => {
    vi.stubEnv("NODE_ENV", "production"); expect((await solTestRequest(request(), "quote")).status).toBe(503);
    expect(rpc.genesis).not.toHaveBeenCalled();
    vi.stubEnv("PAYMENTS_DEVNET_ALLOW_PRODUCTION", "true"); expect((await solTestRequest(request(), "quote")).status).toBe(200);
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("PAYMENTS_DEVNET_ENABLED", "false"); expect((await solTestRequest(request(), "quote")).status).toBe(503);
  });
  it("rejects unauthenticated callers before any RPC", async () => {
    auth.requireActor.mockRejectedValue(new Error("unauthenticated"));
    const response = await solTestRequest(request(), "quote");
    expect(response.status).toBe(401);
    expect(await response.text()).toContain("已登录");
    expect(rpc.genesis).not.toHaveBeenCalled();
  });
  it("rejects cross-origin and missing origin", async () => {
    for (const origin of ["https://evil.example", ""]) expect((await solTestRequest(request(undefined, origin), "quote")).status).toBe(403);
    expect(rpc.genesis).not.toHaveBeenCalled();
  });
  it("issues a quote and checks only with valid capability and signature", async () => {
    const response = await solTestRequest(request(), "quote"); expect(response.status).toBe(200);
    const issued = solTestCheckoutSchema.parse(await response.json());
    expect(issued.quote.amountAtomic).toBe("1000000");
    const result = await solTestRequest(request({ token: issued.token, signature: testSignature }), "check");
    expect(await result.json()).toEqual({ status: "pending" });
    for (const body of [{ token: issued.token, signature: "bad" }, { token: "bad", signature: testSignature }]) {
      expect((await solTestRequest(request(body), "check")).status).toBe(400);
    }
  });
  it("returns recoverable errors without leaking RPC details", async () => {
    rpc.genesis.mockRejectedValue(new Error("secret endpoint"));
    const response = await solTestRequest(request(), "quote"); expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret endpoint");
  });
});
