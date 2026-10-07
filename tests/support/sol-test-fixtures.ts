import { getBase58Decoder } from "@solana/kit";
import { getTransferSolInstructionDataEncoder, SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
import { SOL_TEST_LAMPORTS, type SolTestQuote } from "@/lib/payments/sol-test/contracts";

export const testAddress = (byte: number) => getBase58Decoder().decode(new Uint8Array(32).fill(byte));
export const testSignature = getBase58Decoder().decode(new Uint8Array(64).fill(7));
export const quoteFixture = (): SolTestQuote => ({ network: "devnet", amountAtomic: SOL_TEST_LAMPORTS, recipient: testAddress(2), reference: testAddress(3), createdAt: 1000, expiresAt: 2200 });
export function transactionFixture() {
  return {
    blockTime: 1100 as number | null,
    meta: { err: null as unknown, preBalances: [2_000_000_000n, 0n, 1n, 0n], postBalances: [1_998_995_000n, 1_000_000n, 1n, 0n] },
    transaction: { signatures: [testSignature], message: {
      accountKeys: [testAddress(1), testAddress(2), SYSTEM_PROGRAM_ADDRESS as string, testAddress(3)],
      header: { numRequiredSignatures: 1, numReadonlyUnsignedAccounts: 2, numReadonlySignedAccounts: 0 },
      instructions: [{ programIdIndex: 2, accounts: [0, 1, 3], data: getBase58Decoder().decode(getTransferSolInstructionDataEncoder().encode({ amount: 1_000_000n })) }],
    } },
  };
}
