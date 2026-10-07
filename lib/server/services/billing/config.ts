import { getRuntimeConfig, type RuntimeEnvironment } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";
import {
  assertSolanaAddress,
  NATIVE_USDC_MINTS,
  SOLANA_TOKEN_PROGRAM,
  type PaymentCluster,
} from "@/lib/server/integrations/solana/transfer-request";
import { canonicalJsonDigest } from "@/lib/server/security/digests";

// Keep payment creation fail-closed until this repository has a durable RPC verifier/consumer.
export const PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED = false;

export interface PaymentRuntimeConfiguration {
  environment: RuntimeEnvironment;
  cluster: PaymentCluster;
  rpcUrl: string;
  genesisHash: string;
  mint: string;
  tokenProgram: string;
  recipient: string;
  decimals: 6;
  catalogVersion: string;
  catalogStatus: "pilot" | "current";
  creditUnitPriceMinor: string;
  minimumCredits: number;
  networkConfigVersion: string;
}

export function requirePaymentRuntimeConfiguration(): PaymentRuntimeConfiguration {
  const runtime = getRuntimeConfig();
  const { solana, billing } = runtime;
  if (
    !solana.cluster
    || !solana.rpcUrl
    || !solana.genesisHash
    || !solana.recipient
    || !solana.mint
    || !solana.tokenProgram
    || !billing.configured
    || !billing.catalogVersion
    || !billing.catalogStatus
    || !billing.creditUnitPriceMinor
    || !billing.settlementWorkerEnabled
    || !PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED
  ) {
    throw unavailable();
  }
  if (solana.cluster !== "devnet" && solana.cluster !== "mainnet-beta") {
    throw unavailable();
  }
  if ((runtime.environment === "production") !== (solana.cluster === "mainnet-beta")) {
    throw new ApiError(503, "PAYMENT_ENVIRONMENT_MISMATCH", "Payment network does not match the runtime environment");
  }
  if (solana.cluster === "mainnet-beta" && !billing.mainnetEnabled) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Mainnet payment order creation is disabled");
  }
  if (solana.mint !== NATIVE_USDC_MINTS[solana.cluster] || solana.tokenProgram !== SOLANA_TOKEN_PROGRAM) {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_INVALID", "The configured native USDC asset is not allowed");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(billing.catalogVersion)) {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_INVALID", "Billing catalog version is invalid");
  }
  const rpcUrl = normalizeRpcUrl(solana.rpcUrl, runtime.environment !== "production");
  if (!rpcUrl) {
    throw new ApiError(503, "PAYMENT_CONFIGURATION_INVALID", "Solana RPC URL is invalid");
  }

  const genesisHash = assertSolanaAddress(solana.genesisHash, "Solana genesis hash");
  const recipient = assertSolanaAddress(solana.recipient, "Solana recipient");
  const mint = assertSolanaAddress(solana.mint, "USDC mint");
  const tokenProgram = assertSolanaAddress(solana.tokenProgram, "Token program");
  const networkConfigVersion = canonicalJsonDigest({
    environment: runtime.environment,
    cluster: solana.cluster,
    genesisHash,
    mint,
    tokenProgram,
    recipient,
  });

  return {
    environment: runtime.environment,
    cluster: solana.cluster,
    rpcUrl,
    genesisHash,
    mint,
    tokenProgram,
    recipient,
    decimals: 6,
    catalogVersion: billing.catalogVersion,
    catalogStatus: billing.catalogStatus,
    creditUnitPriceMinor: billing.creditUnitPriceMinor,
    minimumCredits: billing.minimumCredits,
    networkConfigVersion,
  };
}

function normalizeRpcUrl(value: string, allowLocalHttp: boolean): string | null {
  try {
    const parsed = new URL(value);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
    if (parsed.protocol !== "https:" && !(allowLocalHttp && isLocal && parsed.protocol === "http:")) {
      return null;
    }
    if (parsed.username || parsed.password || parsed.hash) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function unavailable(): ApiError {
  return new ApiError(503, "CAPABILITY_UNAVAILABLE", "Solana payment configuration is unavailable", {
    retryable: false,
  });
}
