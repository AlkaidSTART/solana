export type SettlementEnvironment = "test" | "development" | "production";
export type SolanaSettlementCluster = "devnet" | "mainnet-beta";
export type SettlementCommitment = "processed" | "confirmed" | "finalized";

export interface SettlementExpected {
  environment: SettlementEnvironment;
  cluster: SolanaSettlementCluster;
  genesisHash: string;
  mint: string;
  tokenProgram: string;
  recipient: string;
  reference: string;
  amountMinor: string;
  createdAt: string;
  expiresAt: string;
}

export interface SettlementEvidence {
  signature: string;
  transferIndex: number;
  cluster: string;
  genesisHash: string;
  commitment: SettlementCommitment;
  transactionSucceeded: boolean;
  mint: string;
  tokenProgram: string;
  recipient: string;
  referenceAccounts: readonly string[];
  amountMinor: string;
  blockTime: number | null;
}

export type SettlementReviewCode =
  | "ENVIRONMENT_CLUSTER_MISMATCH"
  | "INVALID_SIGNATURE"
  | "INVALID_TRANSFER_INDEX"
  | "INVALID_CLUSTER"
  | "INVALID_COMMITMENT"
  | "INVALID_TRANSACTION_STATUS"
  | "INVALID_GENESIS_HASH"
  | "INVALID_MINT"
  | "INVALID_TOKEN_PROGRAM"
  | "INVALID_RECIPIENT"
  | "INVALID_REFERENCE"
  | "INVALID_REFERENCE_ACCOUNT"
  | "INVALID_AMOUNT"
  | "INVALID_QUOTE_TIME"
  | "INVALID_BLOCK_TIME"
  | "TRANSACTION_FAILED"
  | "CLUSTER_MISMATCH"
  | "GENESIS_HASH_MISMATCH"
  | "MINT_MISMATCH"
  | "TOKEN_PROGRAM_MISMATCH"
  | "RECIPIENT_MISMATCH"
  | "REFERENCE_MISMATCH"
  | "AMOUNT_MISMATCH"
  | "BLOCK_TIME_MISSING"
  | "PAYMENT_BEFORE_QUOTE"
  | "PAYMENT_EXPIRED";

export type SettlementDecision =
  | { status: "review_required"; code: SettlementReviewCode }
  | { status: "pending"; code: "AWAITING_FINALIZATION" }
  | {
      status: "eligible";
      code: "SETTLEMENT_ELIGIBLE";
      amountMinor: string;
      transferIdentity: {
        cluster: SolanaSettlementCluster;
        signature: string;
        transferIndex: number;
      };
    };

const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;
const ISO_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export function evaluateSettlement(
  expected: SettlementExpected,
  evidence: SettlementEvidence,
): SettlementDecision {
  if (!environmentMatchesCluster(expected.environment, expected.cluster)) {
    return review("ENVIRONMENT_CLUSTER_MISMATCH");
  }
  if (!isBase58(evidence.signature, 64, 88)) {
    return review("INVALID_SIGNATURE");
  }
  if (!Number.isSafeInteger(evidence.transferIndex) || evidence.transferIndex < 0) {
    return review("INVALID_TRANSFER_INDEX");
  }
  if (!isCluster(evidence.cluster)) {
    return review("INVALID_CLUSTER");
  }
  if (!isCommitment(evidence.commitment)) {
    return review("INVALID_COMMITMENT");
  }
  if (typeof evidence.transactionSucceeded !== "boolean") {
    return review("INVALID_TRANSACTION_STATUS");
  }
  if (!isBase58(expected.genesisHash, 32, 44) || !isBase58(evidence.genesisHash, 32, 44)) {
    return review("INVALID_GENESIS_HASH");
  }
  if (!isBase58(expected.mint, 32, 44) || !isBase58(evidence.mint, 32, 44)) {
    return review("INVALID_MINT");
  }
  if (!isBase58(expected.tokenProgram, 32, 44) || !isBase58(evidence.tokenProgram, 32, 44)) {
    return review("INVALID_TOKEN_PROGRAM");
  }
  if (!isBase58(expected.recipient, 32, 44) || !isBase58(evidence.recipient, 32, 44)) {
    return review("INVALID_RECIPIENT");
  }
  if (!isBase58(expected.reference, 32, 44)) {
    return review("INVALID_REFERENCE");
  }
  if (
    !Array.isArray(evidence.referenceAccounts)
    || evidence.referenceAccounts.length > 256
    || evidence.referenceAccounts.some((account) => !isBase58(account, 32, 44))
  ) {
    return review("INVALID_REFERENCE_ACCOUNT");
  }
  const expectedAmount = normalizeAmountMinor(expected.amountMinor);
  const observedAmount = normalizeAmountMinor(evidence.amountMinor);
  if (expectedAmount === null || observedAmount === null) {
    return review("INVALID_AMOUNT");
  }
  const createdAt = parseExpectedTime(expected.createdAt);
  const expiresAt = parseExpectedTime(expected.expiresAt);
  if (createdAt === null || expiresAt === null || expiresAt < createdAt) {
    return review("INVALID_QUOTE_TIME");
  }
  if (evidence.blockTime === null) {
    return review("BLOCK_TIME_MISSING");
  }
  if (
    !Number.isSafeInteger(evidence.blockTime)
    || evidence.blockTime < 0
    || evidence.blockTime > Math.floor(Number.MAX_SAFE_INTEGER / 1000)
  ) {
    return review("INVALID_BLOCK_TIME");
  }

  if (!evidence.transactionSucceeded) {
    return review("TRANSACTION_FAILED");
  }
  if (evidence.cluster !== expected.cluster) {
    return review("CLUSTER_MISMATCH");
  }
  if (evidence.genesisHash !== expected.genesisHash) {
    return review("GENESIS_HASH_MISMATCH");
  }
  if (evidence.mint !== expected.mint) {
    return review("MINT_MISMATCH");
  }
  if (evidence.tokenProgram !== expected.tokenProgram) {
    return review("TOKEN_PROGRAM_MISMATCH");
  }
  if (evidence.recipient !== expected.recipient) {
    return review("RECIPIENT_MISMATCH");
  }
  if (!evidence.referenceAccounts.includes(expected.reference)) {
    return review("REFERENCE_MISMATCH");
  }
  if (observedAmount !== expectedAmount) {
    return review("AMOUNT_MISMATCH");
  }

  const blockTimeMs = evidence.blockTime * 1000;
  if (blockTimeMs < createdAt) {
    return review("PAYMENT_BEFORE_QUOTE");
  }
  if (blockTimeMs > expiresAt) {
    return review("PAYMENT_EXPIRED");
  }

  if (evidence.commitment === "processed" || evidence.commitment === "confirmed") {
    return { status: "pending", code: "AWAITING_FINALIZATION" };
  }
  // Eligibility is not settlement: the caller must reserve this identity and apply credits atomically in the database.
  return {
    status: "eligible",
    code: "SETTLEMENT_ELIGIBLE",
    amountMinor: expectedAmount,
    transferIdentity: {
      cluster: evidence.cluster,
      signature: evidence.signature,
      transferIndex: evidence.transferIndex,
    },
  };
}

function environmentMatchesCluster(
  environment: SettlementEnvironment,
  cluster: SolanaSettlementCluster,
): boolean {
  return ((environment === "test" || environment === "development") && cluster === "devnet")
    || (environment === "production" && cluster === "mainnet-beta");
}

function isCluster(value: string): value is SolanaSettlementCluster {
  return value === "devnet" || value === "mainnet-beta";
}

function isCommitment(value: unknown): value is SettlementCommitment {
  return value === "processed" || value === "confirmed" || value === "finalized";
}

function isBase58(value: unknown, minLength: number, maxLength: number): value is string {
  return typeof value === "string"
    && value.length >= minLength
    && value.length <= maxLength
    && BASE58_PATTERN.test(value);
}

function normalizeAmountMinor(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  try {
    const amount = BigInt(value);
    return amount > BigInt(0) ? amount.toString() : null;
  } catch {
    return null;
  }
}

function parseExpectedTime(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_TIME_PATTERN.test(value)) {
    return null;
  }
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function review(code: SettlementReviewCode): SettlementDecision {
  return { status: "review_required", code };
}
