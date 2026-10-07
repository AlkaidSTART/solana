import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to an isolated test PostgreSQL database");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(await readFile(new URL("../lib/server/payments/schema.sql", import.meta.url), "utf8"));
    console.log("Devnet payment tables initialized (no production credits)");
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Database initialization failed; check local connection and permissions"); process.exitCode = 1; });
