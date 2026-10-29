import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var realtyosPool: Pool | undefined;
}

function createPool() {
  if (!process.env.DATABASE_URL) return null;
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!global.realtyosPool) global.realtyosPool = createPool() ?? undefined;
  return global.realtyosPool ?? null;
}