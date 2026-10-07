import postgres from "postgres";
import type { RuntimeConfig } from "@/lib/server/config/env";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";

export type Sql = postgres.Sql;
export type TransactionSql = postgres.TransactionSql;

let database: Sql | null = null;
let databaseUrl: string | null = null;

export function getDatabase(): Sql | null {
  const configuredUrl = getRuntimeConfig().databaseUrl;
  if (!configuredUrl) {
    return null;
  }

  if (database && databaseUrl !== configuredUrl) {
    throw new Error("DATABASE_URL changed after database initialization; close the client before reconfiguring it.");
  }

  if (!database) {
    databaseUrl = configuredUrl;
    database = postgres(configuredUrl, {
      max: 10,
      connect_timeout: 5,
      idle_timeout: 20,
      onnotice: () => undefined,
    });
  }

  return database;
}

export function requireDatabase(): Sql {
  let configured: Sql | null;
  try {
    configured = getDatabase();
  } catch (error) {
    if (isConnectionFailure(error)) {
      throw databaseUnavailable();
    }
    throw error;
  }

  if (!configured) {
    throw databaseUnavailable();
  }

  return configured;
}

export async function withDatabase<T>(callback: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = requireDatabase();
  try {
    return await callback(sql);
  } catch (error) {
    if (isConnectionFailure(error)) {
      throw databaseUnavailable();
    }
    throw error;
  }
}

export async function withTransaction<T>(callback: (sql: TransactionSql) => Promise<T>): Promise<T> {
  return withDatabase(async (database) => {
    const result = await database.begin(async (transaction) => ({
      value: await callback(transaction),
    }));

    return result.value;
  });
}

export async function checkDatabase(): Promise<"ok" | "down" | "unconfigured"> {
  try {
    const configured = getDatabase();
    if (!configured) {
      return "unconfigured";
    }

    await configured`select 1`;
    return "ok";
  } catch {
    return "down";
  }
}

export async function closeDatabaseForTests(): Promise<void> {
  const configured = database;
  database = null;
  databaseUrl = null;

  if (configured) {
    await configured.end({ timeout: 0 });
  }
}

export function isProductionSecurityConfigured(config: RuntimeConfig = getRuntimeConfig()): boolean {
  return config.environment === "production" && config.security.productionReady;
}

function databaseUnavailable(): ApiError {
  return new ApiError(503, "DATABASE_UNAVAILABLE", "Database is unavailable", { retryable: true });
}

function isConnectionFailure(error: unknown): boolean {
  if (error instanceof ApiError) {
    return false;
  }
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = error.code;
  if (typeof code !== "string") {
    return false;
  }

  return code.startsWith("08")
    || code === "57P01"
    || code === "57P02"
    || code === "57P03"
    || code === "53300"
    || code === "ECONNREFUSED"
    || code === "ECONNRESET"
    || code === "ETIMEDOUT"
    || code === "ENETUNREACH"
    || code === "EHOSTUNREACH"
    || code === "EPIPE"
    || code === "ENOTFOUND"
    || code === "EAI_AGAIN"
    || code === "CONNECT_TIMEOUT"
    || code === "CONNECTION_DESTROYED"
    || code === "CONNECTION_CLOSED"
    || code === "CONNECTION_ENDED";
}
