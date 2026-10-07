import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEVNET_GENESIS } from "@/lib/payments/contracts";
import { orderFixture, tenant, testSignature, transactionFixture } from "@/tests/support/payment-fixtures";

import { PaymentRepository } from "./repository";
import { reconcile } from "./reconcile";
import type { Database } from "./database";
import type { PaymentChain } from "./rpc";

const engine = new PGlite();
const db: Database = {
  query: (sql, values) => engine.query<Record<string, unknown>>(sql, values),
  transaction: (work) => engine.transaction((tx) => work({ query: (sql, values) => tx.query<Record<string, unknown>>(sql, values) })),
};
const repository = new PaymentRepository(db);
const transfer = { signature: testSignature, position: 0, blockTime: Date.parse("2026-10-07T00:01:00Z") / 1000 };
beforeAll(async () => { await engine.exec(await readFile("lib/server/payments/schema.sql", "utf8")); });
beforeEach(async () => { await engine.exec("TRUNCATE payment_candidates,payment_transfers,test_credit_ledger,payment_orders CASCADE"); });
afterAll(() => engine.close());

describe("PostgreSQL settlement", () => {
  it("concurrent duplicate creation and settlement are idempotent", async () => {
    const order = orderFixture(); const key = randomUUID();
    const created = await Promise.all(Array.from({ length: 10 }, () => repository.create({ ...order, id: randomUUID() }, key)));
    expect(new Set(created.map((o) => o.id)).size).toBe(1);
    await Promise.all(Array.from({ length: 10 }, () => repository.settle(created[0], transfer)));
    const billing = await repository.billing(tenant);
    expect(billing.availableCredits).toBe(100); expect(billing.ledger).toHaveLength(1);
    expect(billing.orders[0].status).toBe("credited");
    const restarted = new PaymentRepository(db);
    expect((await restarted.get(created[0].id, tenant))?.signature).toBe(testSignature);
  });
  it("rejects idempotency body conflict", async () => {
    const order = orderFixture(); const key = randomUUID();
    await repository.create(order, key);
    await expect(repository.create({ ...order, credits: 200 }, key)).rejects.toThrow("conflicts");
  });
  it("isolates tenants and does not allow the same transfer for a second order", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    await repository.settle(order, transfer);
    const otherTenant = randomUUID();
    expect(await repository.get(order.id, otherTenant)).toBeNull();
    expect((await repository.billing(otherTenant)).availableCredits).toBe(0);
    const other = await repository.create({ ...orderFixture(), id: randomUUID(), tenantId: otherTenant, reference: "other" }, randomUUID());
    await expect(repository.settle(other, transfer)).rejects.toThrow();
    expect((await repository.get(other.id, otherTenant))?.status).toBe("awaiting_payment");
    expect((await repository.billing(otherTenant)).ledger).toHaveLength(0);
  });
  it("rolls back transfer occupancy if ledger insert fails", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    await engine.exec("ALTER TABLE test_credit_ledger ADD CONSTRAINT injected_failure CHECK (credits < 0)");
    try {
      await expect(repository.settle(order, transfer)).rejects.toThrow();
      expect((await db.query("SELECT * FROM payment_transfers")).rows).toHaveLength(0);
      expect((await repository.get(order.id, tenant))?.status).toBe("awaiting_payment");
    } finally { await engine.exec("ALTER TABLE test_credit_ledger DROP CONSTRAINT injected_failure"); }
  });
});
function mockChain(finalized: boolean): PaymentChain {
  return { genesis: async () => DEVNET_GENESIS, signatures: async () => [{ signature: testSignature, blockTime: transfer.blockTime }], transaction: async (_signature, commitment) => commitment === "confirmed" || finalized ? transactionFixture() : null };
}
describe("reconciliation", () => {
  it("confirmed does not credit; finalized credits once even after quote expiry", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    await reconcile(order, mockChain(false), repository);
    expect((await repository.get(order.id, tenant))?.status).toBe("confirmed");
    expect((await repository.billing(tenant)).availableCredits).toBe(0);
    await reconcile(order, mockChain(true), repository);
    await reconcile(order, mockChain(true), repository);
    expect((await repository.billing(tenant)).availableCredits).toBe(100);
  });
  it("moves a disappeared confirmed candidate to review without credit", async () => {
    const order = await repository.create({ ...orderFixture(), status: "confirmed" }, randomUUID());
    const chain = mockChain(false); chain.signatures = async () => [];
    await reconcile(order, chain, repository);
    expect((await repository.get(order.id, tenant))?.status).toBe("review_required");
    expect((await repository.billing(tenant)).availableCredits).toBe(0);
  });
  it("reviews mismatched amount then accepts a later valid candidate", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    const chain = mockChain(true);
    const invalid = transactionFixture(); invalid.meta.postTokenBalances[1].uiTokenAmount.amount = "1000000";
    chain.transaction = async () => invalid;
    await reconcile(order, chain, repository);
    expect((await repository.get(order.id, tenant))?.status).toBe("review_required");
    expect((await repository.billing(tenant)).availableCredits).toBe(0);
    await reconcile(order, mockChain(true), repository);
    expect((await repository.billing(tenant)).availableCredits).toBe(100);
  });
  it("continues after invalid candidate and across pages", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    const chain = mockChain(true);
    chain.signatures = async (_ref, before) => before ? [{ signature: testSignature, blockTime: transfer.blockTime }] : Array.from({ length: 100 }, (_, i) => ({ signature: `invalid-${i}`, blockTime: transfer.blockTime }));
    chain.transaction = async (id) => id === testSignature ? transactionFixture() : {};
    await reconcile(order, chain, repository);
    expect((await repository.billing(tenant)).availableCredits).toBe(100);
    expect((await db.query("SELECT * FROM payment_candidates")).rows).toHaveLength(101);
  });
  it("fails closed on network or RPC failures", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    const chain = mockChain(true); chain.genesis = async () => "mainnet";
    await expect(reconcile(order, chain, repository)).rejects.toThrow();
    chain.genesis = async () => { throw new Error("timeout"); };
    await expect(reconcile(order, chain, repository)).rejects.toThrow();
    expect((await repository.billing(tenant)).availableCredits).toBe(0);
  });
  it("expires unpaid quote without credit and recovers a delayed valid payment", async () => {
    const order = await repository.create(orderFixture(), randomUUID());
    const empty = mockChain(true); empty.signatures = async () => [];
    await reconcile(order, empty, repository);
    expect((await repository.get(order.id, tenant))?.status).toBe("expired");
    await reconcile(order, mockChain(true), repository);
    expect((await repository.billing(tenant)).availableCredits).toBe(100);
  });
});
