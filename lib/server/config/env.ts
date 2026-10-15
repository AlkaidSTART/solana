export type RuntimeEnvironment = "development" | "test" | "production";

export type RuntimeConfig = {
  environment: RuntimeEnvironment;
  databaseUrl: string | null;
  redisUrl: string | null;
  allowedOrigins: string[];
  trustProxyHeaders: boolean;
  security: {
    sessionSigningKey: string | null;
    csrfSigningKey: string | null;
    credentialEncryptionKey: string | null;
    otpHmacKey: string | null;
    configured: boolean;
    productionReady: boolean;
    missing: string[];
  };
  otpDelivery: {
    provider: "http" | "unconfigured";
    endpoint: string | null;
    bearerToken: string | null;
    configured: boolean;
  };
  woocommerce: {
    consumerKey: string | null;
    consumerSecret: string | null;
    webhookSecret: string | null;
  };
  whatsapp: {
    appSecret: string | null;
    verifyToken: string | null;
    accessToken: string | null;
    graphApiVersion: string | null;
    testRecipients: string[];
  };
  solana: {
    cluster: "devnet" | "testnet" | "mainnet-beta" | null;
    rpcUrl: string | null;
    genesisHash: string | null;
    recipient: string | null;
    mint: string | null;
    tokenProgram: string | null;
  };
  billing: {
    catalogVersion: string | null;
    catalogStatus: "pilot" | "current" | null;
    creditUnitPriceMinor: string | null;
    minimumCredits: number;
    mainnetEnabled: boolean;
    settlementWorkerEnabled: boolean;
    configured: boolean;
  };
};

export type RuntimeCapabilityProjection = {
  environment: RuntimeEnvironment;
  database: "configured" | "unconfigured";
  redis: "configured" | "unconfigured";
  security: "configured" | "unconfigured";
  otpDelivery: "configured" | "unconfigured";
  otpSigning: "configured" | "unconfigured";
  woocommerce: "configured" | "unconfigured";
  whatsapp: "configured" | "unconfigured";
  solanaRpc: "configured" | "unconfigured";
  solanaPayment: "configured" | "unconfigured";
  solanaCluster: RuntimeConfig["solana"]["cluster"];
};

const GRAPH_API_VERSION_PATTERN = /^v\d{1,2}\.\d$/;
// v25.0 is the version used by Meta's own Messages API examples as of 2026-10-15 and stays available
// until 2028-07-29; the Graph API changelog lists v26.0 as the latest release. Override per environment.
const DEFAULT_GRAPH_API_VERSION = "v25.0";
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const MAX_TEST_RECIPIENTS = 50;

function optionalValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(",").map((origin) => origin.trim()).filter((origin) => {
    if (!origin) {
      return false;
    }

    try {
      const parsed = new URL(origin);
      return parsed.origin === origin && (parsed.protocol === "https:" || parsed.protocol === "http:");
    } catch {
      return false;
    }
  }))];
}

function isValidEncryptionKey(value: string | null): boolean {
  if (!value || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return false;
  }

  const decoded = Buffer.from(value, "base64");
  return decoded.length === 32 && decoded.toString("base64") === value;
}

function parseEnvironment(value: string | undefined): RuntimeEnvironment {
  return value === "production" || value === "test" ? value : "development";
}

export function getRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const runtimeEnvironment = parseEnvironment(environment.NODE_ENV);
  const allowedOrigins = parseAllowedOrigins(environment.APP_ALLOWED_ORIGINS);
  const sessionSigningKey = optionalValue(environment.SESSION_SIGNING_KEY);
  const csrfSigningKey = optionalValue(environment.CSRF_SIGNING_KEY);
  const credentialEncryptionKey = optionalValue(environment.CREDENTIAL_ENCRYPTION_KEY);
  const otpHmacKey = optionalValue(environment.OTP_HMAC_KEY);
  const missing: string[] = [];

  if (!sessionSigningKey || Buffer.byteLength(sessionSigningKey, "utf8") < 32) {
    missing.push("SESSION_SIGNING_KEY");
  }
  if (!csrfSigningKey || Buffer.byteLength(csrfSigningKey, "utf8") < 32) {
    missing.push("CSRF_SIGNING_KEY");
  }
  if (!isValidEncryptionKey(credentialEncryptionKey)) {
    missing.push("CREDENTIAL_ENCRYPTION_KEY");
  }
  if (!otpHmacKey || Buffer.byteLength(otpHmacKey, "utf8") < 32) {
    missing.push("OTP_HMAC_KEY");
  }
  if (allowedOrigins.length === 0 || (runtimeEnvironment === "production" && allowedOrigins.some((origin) => !origin.startsWith("https://")))) {
    missing.push("APP_ALLOWED_ORIGINS");
  }

  const otpEndpoint = normalizeOtpEndpoint(environment.OTP_DELIVERY_ENDPOINT);
  const otpBearerToken = optionalValue(environment.OTP_DELIVERY_BEARER_TOKEN);
  const otpDeliveryConfigured = Boolean(otpEndpoint && otpBearerToken);
  const catalogVersion = optionalValue(environment.BILLING_CATALOG_VERSION);
  const catalogStatus = environment.BILLING_CATALOG_STATUS === "pilot" || environment.BILLING_CATALOG_STATUS === "current"
    ? environment.BILLING_CATALOG_STATUS
    : null;
  const creditUnitPriceMinor = positiveIntegerString(environment.BILLING_CREDIT_UNIT_PRICE_MINOR);
  const minimumCredits = positiveSafeInteger(environment.BILLING_MINIMUM_CREDITS) ?? 100;

  return {
    environment: runtimeEnvironment,
    databaseUrl: optionalValue(environment.DATABASE_URL),
    redisUrl: optionalValue(environment.REDIS_URL),
    allowedOrigins,
    trustProxyHeaders: environment.TRUST_PROXY_HEADERS === "true",
    security: {
      sessionSigningKey,
      csrfSigningKey,
      credentialEncryptionKey,
      otpHmacKey,
      configured: missing.length === 0,
      productionReady: runtimeEnvironment === "production" && missing.length === 0,
      missing,
    },
    otpDelivery: {
      provider: otpDeliveryConfigured ? "http" : "unconfigured",
      endpoint: otpEndpoint,
      bearerToken: otpBearerToken,
      configured: otpDeliveryConfigured,
    },
    woocommerce: {
      consumerKey: optionalValue(environment.WOOCOMMERCE_CONSUMER_KEY),
      consumerSecret: optionalValue(environment.WOOCOMMERCE_CONSUMER_SECRET),
      webhookSecret: optionalValue(environment.WOOCOMMERCE_WEBHOOK_SECRET),
    },
    whatsapp: {
      appSecret: optionalValue(environment.WHATSAPP_APP_SECRET),
      verifyToken: optionalValue(environment.WHATSAPP_VERIFY_TOKEN),
      accessToken: optionalValue(environment.WHATSAPP_ACCESS_TOKEN),
      graphApiVersion: parseGraphApiVersion(environment.WHATSAPP_GRAPH_API_VERSION),
      testRecipients: parseTestRecipients(environment.WHATSAPP_TEST_RECIPIENTS),
    },
    solana: {
      cluster: environment.SOLANA_CLUSTER === "devnet" || environment.SOLANA_CLUSTER === "testnet" || environment.SOLANA_CLUSTER === "mainnet-beta"
        ? environment.SOLANA_CLUSTER
        : null,
      rpcUrl: optionalValue(environment.SOLANA_RPC_URL),
      genesisHash: optionalValue(environment.SOLANA_GENESIS_HASH),
      recipient: optionalValue(environment.SOLANA_RECIPIENT),
      mint: optionalValue(environment.SOLANA_USDC_MINT),
      tokenProgram: optionalValue(environment.SOLANA_TOKEN_PROGRAM),
    },
    billing: {
      catalogVersion,
      catalogStatus,
      creditUnitPriceMinor,
      minimumCredits,
      mainnetEnabled: environment.BILLING_ENABLE_MAINNET === "true",
      settlementWorkerEnabled: environment.BILLING_SETTLEMENT_WORKER_ENABLED === "true",
      configured: Boolean(catalogVersion && catalogStatus && creditUnitPriceMinor),
    },
  };
}

export function getRuntimeCapabilityProjection(
  config: RuntimeConfig = getRuntimeConfig(),
): RuntimeCapabilityProjection {
  const isConfigured = (value: string | null): "configured" | "unconfigured" =>
    value ? "configured" : "unconfigured";

  return {
    environment: config.environment,
    database: isConfigured(config.databaseUrl),
    redis: isConfigured(config.redisUrl),
    security: config.security.configured ? "configured" : "unconfigured",
    otpDelivery: config.otpDelivery.configured ? "configured" : "unconfigured",
    otpSigning: config.security.otpHmacKey && Buffer.byteLength(config.security.otpHmacKey, "utf8") >= 32
      ? "configured"
      : "unconfigured",
    woocommerce: config.woocommerce.consumerKey && config.woocommerce.consumerSecret && config.woocommerce.webhookSecret
      ? "configured"
      : "unconfigured",
    whatsapp: config.whatsapp.appSecret && config.whatsapp.verifyToken && config.whatsapp.accessToken
      && config.whatsapp.graphApiVersion
      ? "configured"
      : "unconfigured",
    solanaRpc: isConfigured(config.solana.rpcUrl),
    solanaPayment: config.solana.rpcUrl && config.solana.genesisHash && config.solana.recipient
      && config.solana.mint && config.solana.tokenProgram && config.solana.cluster
      && config.billing.configured && config.billing.settlementWorkerEnabled
      ? "configured"
      : "unconfigured",
    solanaCluster: config.solana.cluster,
  };
}

function positiveIntegerString(value: string | undefined): string | null {
  const normalized = optionalValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  try {
    const parsed = BigInt(normalized);
    return parsed > BigInt(0) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function positiveSafeInteger(value: string | undefined): number | null {
  const normalized = optionalValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseGraphApiVersion(value: string | undefined): string | null {
  const normalized = optionalValue(value);
  if (!normalized) {
    return DEFAULT_GRAPH_API_VERSION;
  }

  return GRAPH_API_VERSION_PATTERN.test(normalized) ? normalized : null;
}

function parseTestRecipients(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const recipients = value
    .split(",")
    .map((entry) => entry.trim().replace(/[\s()-]/g, ""))
    .filter((entry) => E164_PATTERN.test(entry));

  return [...new Set(recipients)].slice(0, MAX_TEST_RECIPIENTS);
}

function normalizeOtpEndpoint(value: string | undefined): string | null {
  const normalized = optionalValue(value);
  if (!normalized) {
    return null;
  }

  try {
    const endpoint = new URL(normalized);
    const localHttp = endpoint.protocol === "http:"
      && (endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1" || endpoint.hostname === "[::1]");
    if (endpoint.protocol !== "https:" && !localHttp) {
      return null;
    }
    return endpoint.toString();
  } catch {
    return null;
  }
}
