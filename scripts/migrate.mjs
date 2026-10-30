import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const client = new Client({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: true },
});

async function main() {
  await client.connect();
  await client.query("SELECT pg_advisory_lock(824731905)");
  await client.query(\`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  \`);

  const directory = join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const source = await readFile(join(directory, file), "utf8");
    const checksum = createHash("sha256").update(source).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM schema_migrations WHERE version = $1",
      [file]
    );

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(\`Applied migration was modified: \${file}\`);
      }
      console.log(\`Already applied: \${file}\`);
      continue;
    }

    const sql = source
      .replace(/^\s*BEGIN\s*;?/im, "")
      .replace(/COMMIT\s*;?\s*$/i, "");

    console.log(\`Applying: \${file}\`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
        [file, checksum]
      );
      await client.query("COMMIT");
      console.log(\`Applied: \${file}\`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.query("SELECT pg_advisory_unlock(824731905)");
    } catch {}
    await client.end().catch(() => {});
  });
