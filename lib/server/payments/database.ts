import "server-only";
import { Pool } from "pg";

export interface SqlConnection {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
}
export interface Database extends SqlConnection {
  transaction<T>(work: (sql: SqlConnection) => Promise<T>): Promise<T>;
}
let pool: Pool | undefined;
export function database(): Database {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  const currentPool = pool;
  return {
    query: (sql, values) => currentPool.query(sql, values),
    async transaction(work) {
      const client = await currentPool.connect();
      try { await client.query("BEGIN"); const result = await work(client); await client.query("COMMIT"); return result; }
      catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
  };
}
