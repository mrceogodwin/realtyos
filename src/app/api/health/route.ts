import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json({
      status: "needs_configuration",
      app: "RealtyOS",
      database: "DATABASE_URL is not configured",
    }, { status: 503 });
  }

  try {
    const result = await pool.query(
      "select current_database() as database_name, now() as checked_at"
    );
    return NextResponse.json({
      status: "ok",
      app: "RealtyOS",
      database: "connected",
      databaseName: result.rows[0].database_name,
      checkedAt: result.rows[0].checked_at,
    });
  } catch {
    return NextResponse.json({
      status: "database_error",
      app: "RealtyOS",
      database: "connection failed",
    }, { status: 503 });
  }
}