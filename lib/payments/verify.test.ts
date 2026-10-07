import { describe, expect, it } from "vitest";

import { orderFixture, testSignature, transactionFixture } from "../../tests/support/payment-fixtures";
import { DEVNET_GENESIS, creditInput, quoteAtomic, paymentUrl } from "./contracts";
import { verifyTransfer } from "./verify";

describe("quote", () => {
  it("pins the complete Devnet genesis returned by the public RPC", () => {
    expect(DEVNET_GENESIS).toBe("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG");
  });
  it("uses exact atomic amounts and PRD price without bonus", () => {
    expect(quoteAtomic(100)).toBe("2000000");
    expect(quoteAtomic(2500)).toBe("50000000");
    expect(paymentUrl(orderFixture())).toContain("amount=2.000000");
  });
  it.each([0, -1, 99, 100.5, 100001, NaN, Infinity, "100", null])("rejects invalid credits %s", (credits) => {
    expect(creditInput.safeParse({ credits }).success).toBe(false);
  });
  it("rejects client-supplied tenant or price", () => {
    expect(creditInput.safeParse({ credits: 100, tenantId: "other" }).success).toBe(false);
  });
});
describe("chain validation", () => {
  it.each([true, false])("accepts valid SPL transfer checked=%s", (checked) => {
    expect(verifyTransfer(orderFixture(), testSignature, transactionFixture(checked), DEVNET_GENESIS).kind).toBe("valid");
  });
  const invalid: [string, (tx: ReturnType<typeof transactionFixture>) => void][] = [
    ["missing chain time", (tx) => { tx.blockTime = null; }],
    ["late transfer", (tx) => { tx.blockTime = Date.parse("2026-10-07T00:21:00Z") / 1000; }],
    ["early transfer", (tx) => { tx.blockTime = Date.parse("2026-10-06T23:59:59Z") / 1000; }],
    ["failed transaction", (tx) => { tx.meta.err = { InstructionError: [0, "error"] }; }],
    ["wrong signature", (tx) => { tx.transaction.signatures[0] = "different"; }],
    ["wrong mint", (tx) => { (tx.meta.postTokenBalances[1] as { mint: string }).mint = "wrong"; }],
    ["wrong owner", (tx) => { tx.meta.postTokenBalances[1].owner = "wrong"; }],
    ["wrong token program", (tx) => { tx.meta.postTokenBalances[1].programId = "wrong"; }],
    ["wrong ATA", (tx) => { tx.transaction.message.accountKeys[2] = "wrong"; }],
    ["wrong decimals", (tx) => { tx.meta.postTokenBalances[1].uiTokenAmount.decimals = 9; }],
    ["underpayment", (tx) => { tx.meta.postTokenBalances[1].uiTokenAmount.amount = "1999999"; }],
    ["overpayment", (tx) => { tx.meta.postTokenBalances[1].uiTokenAmount.amount = "2000001"; }],
    ["reference only elsewhere", (tx) => { tx.transaction.message.instructions[0].accounts.pop(); }],
    ["writable reference", (tx) => { tx.transaction.message.header.numReadonlyUnsignedAccounts = 0; }],
    ["wrong instruction program", (tx) => { tx.transaction.message.instructions[0].programIdIndex = 3; }],
    ["malformed instruction", (tx) => { tx.transaction.message.instructions[0].data = "!"; }],
    ["ambiguous transfer", (tx) => { tx.transaction.message.instructions.push(tx.transaction.message.instructions[0]); }],
    ["self transfer", (tx) => { tx.transaction.message.instructions[0].accounts[0] = 2; }],
  ];
  it.each(invalid)("rejects %s", (_name, mutate) => {
    const tx = transactionFixture(); mutate(tx);
    expect(verifyTransfer(orderFixture(), testSignature, tx, DEVNET_GENESIS).kind).toBe("invalid");
  });
  it("rejects mainnet RPC and malformed payloads", () => {
    expect(verifyTransfer(orderFixture(), testSignature, transactionFixture(), "mainnet").kind).toBe("invalid");
    expect(verifyTransfer(orderFixture(), testSignature, {}, DEVNET_GENESIS).kind).toBe("invalid");
  });
});
