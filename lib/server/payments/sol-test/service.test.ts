import { describe, expect, it, vi } from "vitest";

import { DEVNET_GENESIS } from "@/lib/payments/contracts";
import { quoteFixture, transactionFixture, testAddress, testSignature } from "@/tests/support/sol-test-fixtures";
import { createSolTestQuotes } from "./quote";
import { checkSolTest } from "./service";

describe("signed local SOL quotes", () => {
  const quotes = createSolTestQuotes(Buffer.alloc(32, 1), () => 1000);
  it("issues fixed small amount and distinct references", () => {
    const a = quotes.issue(testAddress(2)), b = quotes.issue(testAddress(2));
    expect(a.quote.amountAtomic).toBe("1000000");
    expect(a.quote.reference).not.toBe(b.quote.reference);
    expect(quotes.read(a.token, testAddress(2))).toEqual(a.quote);
  });
  it("rejects modified payload, wrong recipient or process key", () => {
    const issued = quotes.issue(testAddress(2));
    const payload = Buffer.from(JSON.stringify({ ...issued.quote, amountAtomic: "0" })).toString("base64url");
    expect(() => quotes.read(`${payload}.${issued.token.split(".")[1]}`, testAddress(2))).toThrow();
    expect(() => quotes.read(issued.token, testAddress(9))).toThrow();
    expect(() => createSolTestQuotes(Buffer.alloc(32, 2), () => 1000).read(issued.token, testAddress(2))).toThrow();
    for (const bad of ["", "a.b.c", "a.b"]) expect(() => quotes.read(bad, testAddress(2))).toThrow();
  });
  it("allows recovery after expiry; chain-time validation remains required", () => {
    const issued = quotes.issue(testAddress(2));
    expect(createSolTestQuotes(Buffer.alloc(32, 1), () => 9000).read(issued.token, testAddress(2))).toEqual(issued.quote);
  });
});
describe("read-only chain verification", () => {
  const chain = () => ({ genesis: vi.fn().mockResolvedValue(DEVNET_GENESIS), signatures: vi.fn(), transaction: vi.fn() });
  it("returns pending then confirmed, never success before finalized", async () => {
    const rpc = chain(); rpc.transaction.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    expect(await checkSolTest(rpc, quoteFixture(), testSignature)).toEqual({ status: "pending" });
    rpc.transaction.mockResolvedValueOnce(null).mockResolvedValueOnce(transactionFixture());
    expect(await checkSolTest(rpc, quoteFixture(), testSignature)).toEqual({ status: "confirmed" });
    expect(rpc.transaction.mock.calls.map((c) => c[1])).toEqual(["finalized", "confirmed", "finalized", "confirmed"]);
  });
  it("verifies finalized and repeated checks without write side effects", async () => {
    const rpc = chain(); rpc.transaction.mockResolvedValue(transactionFixture());
    for (let i = 0; i < 2; i++) expect(await checkSolTest(rpc, quoteFixture(), testSignature)).toEqual({ status: "verified" });
    expect(rpc.signatures).not.toHaveBeenCalled();
  });
  it("rejects finalized failure and incorrect genesis", async () => {
    const rpc = chain(); const tx = transactionFixture(); tx.meta.err = "failed"; rpc.transaction.mockResolvedValue(tx);
    expect((await checkSolTest(rpc, quoteFixture(), testSignature)).status).toBe("invalid");
    rpc.genesis.mockResolvedValue("mainnet"); rpc.transaction.mockResolvedValue(transactionFixture());
    expect((await checkSolTest(rpc, quoteFixture(), testSignature)).status).toBe("invalid");
  });
  it("propagates RPC timeout, not success", async () => {
    const rpc = chain(); rpc.transaction.mockRejectedValue(new Error("timeout"));
    await expect(checkSolTest(rpc, quoteFixture(), testSignature)).rejects.toThrow("timeout");
  });
});
