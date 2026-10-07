import { getBase58Decoder } from "@solana/kit";
import { getTransferSolInstructionDataEncoder } from "@solana-program/system";
import { describe, expect, it } from "vitest";

import { DEVNET_GENESIS } from "../contracts";
import { quoteFixture, transactionFixture, testAddress, testSignature } from "@/tests/support/sol-test-fixtures";
import { verifySolTest } from "./verify";

const verify = (tx: unknown, quote = quoteFixture()) => verifySolTest(quote, testSignature, tx, DEVNET_GENESIS);
describe("native SOL evidence (isolated RPC fixtures)", () => {
  it("accepts exact System transfer and bigint balances", () => expect(verify(transactionFixture())).toBeNull());
  it("supports lookup-table readonly reference", () => {
    const tx = transactionFixture(); tx.transaction.message.accountKeys.pop(); tx.transaction.message.header.numReadonlyUnsignedAccounts = 1;
    expect(verify({ ...tx, meta: { ...tx.meta, loadedAddresses: { writable: [], readonly: [testAddress(3)] } } })).toBeNull();
  });
  it.each([
    ["failed execution", (tx: ReturnType<typeof transactionFixture>) => { tx.meta.err = { InstructionError: [0, "Custom"] }; }],
    ["wrong signature", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.signatures[0] = "wrong"; }],
    ["wrong recipient", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.accountKeys[1] = testAddress(9); }],
    ["wrong program", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.accountKeys[2] = testAddress(9); }],
    ["wrong reference", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.accountKeys[3] = testAddress(9); }],
    ["writable reference", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.header.numReadonlyUnsignedAccounts = 0; }],
    ["reference not instruction-local", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.instructions[0].accounts.pop(); }],
    ["self transfer", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.instructions[0].accounts[0] = 1; }],
    ["ambiguous transfer", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.instructions.push(tx.transaction.message.instructions[0]); }],
    ["overpayment", (tx: ReturnType<typeof transactionFixture>) => { tx.meta.postBalances[1]++; }],
    ["underpayment", (tx: ReturnType<typeof transactionFixture>) => { tx.meta.postBalances[1]--; }],
    ["no net receipt", (tx: ReturnType<typeof transactionFixture>) => { tx.meta.postBalances[1] = BigInt(0); }],
    ["before quote", (tx: ReturnType<typeof transactionFixture>) => { tx.blockTime = 999; }],
    ["expired", (tx: ReturnType<typeof transactionFixture>) => { tx.blockTime = 2201; }],
    ["missing time", (tx: ReturnType<typeof transactionFixture>) => { tx.blockTime = null; }],
    ["malformed data", (tx: ReturnType<typeof transactionFixture>) => { tx.transaction.message.instructions[0].data = "!"; }],
  ] as const)("rejects %s", (_, mutate) => { const tx = transactionFixture(); mutate(tx); expect(verify(tx)).not.toBeNull(); });
  it.each([BigInt(0), BigInt(999_999), BigInt(1_000_001)])("rejects instruction amount %s despite net receipt", (amount) => {
    const tx = transactionFixture(); tx.transaction.message.instructions[0].data = getBase58Decoder().decode(getTransferSolInstructionDataEncoder().encode({ amount }));
    expect(verify(tx)).not.toBeNull();
  });
  it("rejects wrong network, null or unsupported transactions", () => {
    expect(verifySolTest(quoteFixture(), testSignature, transactionFixture(), "mainnet")).not.toBeNull();
    for (const input of [null, {}, { meta: {} }]) expect(verify(input)).not.toBeNull();
  });
  it("refuses float balances", () => { const tx = transactionFixture(); expect(verify({ ...tx, meta: { ...tx.meta, postBalances: [1, 1.5, 1, 0] } })).not.toBeNull(); });
});
