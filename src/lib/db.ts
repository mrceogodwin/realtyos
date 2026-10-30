import { Pool, type QueryResultRow } from "pg";

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
      : { rejectUnauthorized: true },
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

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Execute a parameterized query. Throws if the database is not configured.
 * Always use this instead of calling the pool directly so we keep one code path.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const pool = getPool();
  if (!pool) throw new DatabaseNotConfiguredError();
  return pool.query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}
