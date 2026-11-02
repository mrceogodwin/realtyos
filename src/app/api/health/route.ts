import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const requiredColumns = [
  ["user_profiles", "auth_provider_id"],
  ["user_profiles", "email_verified"],
  ["user_profiles", "last_login_at"],
  ["tenants", "country"],
  ["tenants", "currency"],
  ["tenants", "timezone"],
  ["tenants", "deleted_at"],
  ["tenant_memberships", "invited_at"],
  ["tenant_memberships", "accepted_at"],
  ["tenant_memberships", "updated_at"],
  ["properties", "property_type_id"],
  ["properties", "address"],
  ["properties", "created_by"],
  ["leads", "notes"],
  ["leads", "follow_up_at"],
  ["property_viewings", "agent_id"],
  ["property_viewings", "duration_minutes"],
  ["property_viewings", "created_by"],
  ["audit_logs", "actor_id"],
] as const;

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
         to_regclass('public.schema_migrations') IS NOT NULL AS has_migration_history,
         to_regclass('public.viewing_reminder_deliveries') IS NOT NULL AS has_reminder_table,
         ARRAY(
           SELECT format('%s.%s', required.table_name, required.column_name)
             FROM unnest($1::text[], $2::text[]) AS required(table_name, column_name)
            WHERE NOT EXISTS (
              SELECT 1
                FROM information_schema.columns actual
               WHERE actual.table_schema = 'public'
                 AND actual.table_name = required.table_name
                 AND actual.column_name = required.column_name
            )
            ORDER BY required.table_name, required.column_name
         ) AS missing_columns`,
      [requiredColumns.map(([table]) => table), requiredColumns.map(([, column]) => column)]
    );

    const row = result.rows[0];
    let latestMigration: string | null = null;
    if (row.has_migration_history) {
      const history = await pool.query(
        "SELECT max(version) AS latest_migration FROM schema_migrations"
      );
      latestMigration = history.rows[0]?.latest_migration ?? null;
    }

    const missingColumns = row.missing_columns as string[];
    const schemaReady =
      row.has_migration_history &&
      row.has_reminder_table &&
      latestMigration !== null &&
      latestMigration >= "0008_viewing_reminders.sql" &&
      missingColumns.length === 0;

    return NextResponse.json(
      {
        status: schemaReady ? "ok" : "schema_pending",
        app: "RealtyOS",
        database: "connected",
        databaseName: row.database_name,
        checkedAt: row.checked_at,
        schema: schemaReady ? "ready" : "pending_migration",
        latestMigration,
        missingColumns,
        missingReminderTable: !row.has_reminder_table,
        missingMigrationHistory: !row.has_migration_history,
      },
      { status: schemaReady ? 200 : 503 }
    );
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
