import { readFile } from "node:fs/promises";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const client = new Client({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: true },
});

try {
  await client.connect();
  const sql = await readFile(new URL("../db/tests/tenant-integrity.sql", import.meta.url), "utf8");
  await client.query(sql);
  console.log("Tenant integrity database checks passed.");
} catch (error) {
  console.error("Tenant integrity database checks failed:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
