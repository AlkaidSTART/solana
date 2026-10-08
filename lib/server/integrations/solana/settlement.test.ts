import { describe, expect, it } from "vitest";

import { evaluateSettlement, type SettlementEvidence, type SettlementExpected } from "@/lib/server/integrations/solana/settlement";

const expected: SettlementExpected = {
  environment: "test",
  cluster: "devnet",
  genesisHash: "7".repeat(32),
  mint: "2".repeat(32),
  tokenProgram: "3".repeat(32),
  recipient: "4".repeat(32),
  reference: "5".repeat(32),
  amountMinor: "50000000",
  createdAt: "2026-10-07T08:30:00.000Z",
  expiresAt: "2026-10-07T08:50:00.000Z",
};

function evidence(overrides: Partial<SettlementEvidence> = {}): SettlementEvidence {
  return {
    signature: "1".repeat(64),
    transferIndex: 0,
    cluster: "devnet",
    genesisHash: expected.genesisHash,
    commitment: "finalized",
    transactionSucceeded: true,
    mint: expected.mint,
    tokenProgram: expected.tokenProgram,
    recipient: expected.recipient,
    referenceAccounts: [expected.reference],
    amountMinor: "00050000000",
    blockTime: Date.parse("2026-10-07T08:35:00.000Z") / 1000,
    ...overrides,
  };
}

describe("Solana settlement eligibility", () => {
  it("keeps a matching confirmed transfer pending finalization", () => {
    expect(evaluateSettlement(expected, evidence({ commitment: "confirmed" }))).toMatchObject({
      status: "pending",
      code: "AWAITING_FINALIZATION",
    });
  });

  it("requires mint and other quoted terms to match", () => {
    expect(evaluateSettlement(expected, evidence({ mint: "6".repeat(32) }))).toMatchObject({
      status: "review_required",
      code: "MINT_MISMATCH",
    });
    expect(evaluateSettlement(expected, evidence({ genesisHash: "8".repeat(32) }))).toMatchObject({
      status: "review_required",
      code: "GENESIS_HASH_MISMATCH",
    });
    expect(evaluateSettlement(expected, evidence({ recipient: "6".repeat(32) }))).toMatchObject({
      status: "review_required",
      code: "RECIPIENT_MISMATCH",
    });
    expect(evaluateSettlement(expected, evidence({ amountMinor: "49999999" }))).toMatchObject({
      status: "review_required",
      code: "AMOUNT_MISMATCH",
    });
  });

  it("marks fully matched finalized evidence eligible with its unique transfer identity", () => {
    expect(evaluateSettlement(expected, evidence())).toMatchObject({
      status: "eligible",
      code: "SETTLEMENT_ELIGIBLE",
      transferIdentity: { cluster: "devnet", signature: "1".repeat(64), transferIndex: 0 },
      amountMinor: "50000000",
    });
  });

  it("sends missing trusted block time to review", () => {
    expect(evaluateSettlement(expected, evidence({ blockTime: null }))).toMatchObject({
      status: "review_required",
      code: "BLOCK_TIME_MISSING",
    });
  });

  it("rejects an invalid transfer index or commitment", () => {
    expect(evaluateSettlement(expected, evidence({ transferIndex: -1 }))).toMatchObject({
      status: "review_required",
      code: "INVALID_TRANSFER_INDEX",
    });
    expect(evaluateSettlement(expected, evidence({
      commitment: "unknown" as SettlementEvidence["commitment"],
    }))).toMatchObject({
      status: "review_required",
      code: "INVALID_COMMITMENT",
    });
  });
});
