import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getDatabase } from "@/lib/server/db/client";
import type { Sql } from "@/lib/server/db/client";
import { sha256Hex } from "@/lib/server/security/digests";

type MigrationFile = {
  name: string;
  contents: string;
  checksum: string;
};

class MigrationChecksumChangedError extends Error {
  constructor(readonly migrationName: string) {
    super(`Migration checksum changed: ${migrationName}`);
  }
}

const MIGRATIONS_DIRECTORY = fileURLToPath(new URL("../lib/server/db/migrations/", import.meta.url));
const MIGRATION_LOCK_KEY = "solaflow_schema_migrations_v1";

async function loadMigrations(): Promise<MigrationFile[]> {
  const names = (await readdir(MIGRATIONS_DIRECTORY))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/i.test(name))
    .sort((left, right) => left.localeCompare(right));
  const migrations: MigrationFile[] = [];

  for (const name of names) {
    const contents = await readFile(join(MIGRATIONS_DIRECTORY, name), "utf8");
    const normalizedContents = contents.replace(/\r\n?/g, "\n");
    migrations.push({ name, contents, checksum: sha256Hex(normalizedContents) });
  }

  return migrations;
}

async function applyMigrations(sql: Sql, migrations: MigrationFile[]): Promise<void> {
  await sql.begin(async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(hashtext(${MIGRATION_LOCK_KEY}))`;
    await transaction`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    for (const migration of migrations) {
      const rows = await transaction<{ checksum: string }[]>`
        SELECT checksum
        FROM schema_migrations
        WHERE name = ${migration.name}
        FOR UPDATE
      `;
      const previous = rows[0];

      if (previous) {
        if (previous.checksum !== migration.checksum) {
          throw new MigrationChecksumChangedError(migration.name);
        }
        continue;
      }

      await transaction.unsafe(migration.contents);
      await transaction`
        INSERT INTO schema_migrations (name, checksum)
        VALUES (${migration.name}, ${migration.checksum})
      `;
    }
  });
}

async function main(): Promise<void> {
  let sql: ReturnType<typeof getDatabase> = null;

  try {
    const migrations = await loadMigrations();
    sql = getDatabase();
    if (!sql) {
      process.stderr.write("Migration stopped: DATABASE_URL is not configured.\n");
      process.exitCode = 1;
      return;
    }

    await applyMigrations(sql, migrations);
    process.stdout.write("Database migrations are up to date.\n");
  } catch (error) {
    if (error instanceof MigrationChecksumChangedError) {
      process.stderr.write(`Migration stopped: checksum changed for ${error.migrationName}.\n`);
      process.exitCode = 1;
      return;
    }
    process.stderr.write("Migration failed; database details were omitted.\n");
    process.exitCode = 1;
  } finally {
    await sql?.end({ timeout: 0 }).catch(() => undefined);
  }
}

void main();
