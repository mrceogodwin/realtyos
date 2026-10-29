import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      {
        status: "needs_configuration",
        app: "RealtyOS",
        database: "DATABASE_URL is not configured",
        schema: "unknown",
      },
      { status: 503 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
         current_database() AS database_name,
         now() AS checked_at,
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'tenants'
         ) AS has_tenants_table`
    );

    const row = result.rows[0];
    return NextResponse.json({
      status: "ok",
      app: "RealtyOS",
      database: "connected",
      databaseName: row.database_name,
      checkedAt: row.checked_at,
      schema: row.has_tenants_table ? "migrated" : "pending_migration",
    });
  } catch {
    return NextResponse.json(
      {
        status: "database_error",
        app: "RealtyOS",
        database: "connection failed",
      },
      { status: 503 }
    );
  }
}
