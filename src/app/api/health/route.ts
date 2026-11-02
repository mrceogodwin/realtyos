import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const requiredTables = [
  "platform_settings",
  "tenants",
  "tenant_branding",
  "tenant_settings",
  "user_profiles",
  "tenant_memberships",
  "property_types",
  "properties",
  "property_media",
  "saved_properties",
  "leads",
  "property_viewings",
  "tenant_pages",
  "subscriptions",
  "audit_logs",
  "tenant_invitations",
  "public_enquiry_rate_limits",
  "viewing_reminder_deliveries",
] as const;

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
  ["tenant_settings", "contact_email"],
  ["tenant_settings", "contact_phone"],
  ["tenant_settings", "address"],
  ["tenant_settings", "seo_title"],
  ["tenant_settings", "seo_description"],
  ["tenant_settings", "custom_domain"],
  ["tenant_settings", "published"],
  ["tenant_pages", "slug"],
  ["tenant_pages", "published"],
  ["subscriptions", "plan_code"],
  ["subscriptions", "cancel_at_period_end"],
  ["subscriptions", "metadata"],
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
         ARRAY(
           SELECT required.table_name
             FROM unnest($1::text[]) AS required(table_name)
            WHERE NOT EXISTS (
              SELECT 1
                FROM information_schema.tables actual
               WHERE actual.table_schema = 'public'
                 AND actual.table_type = 'BASE TABLE'
                 AND actual.table_name = required.table_name
            )
            ORDER BY required.table_name
         ) AS missing_tables,
         ARRAY(
           SELECT format('%s.%s', required.table_name, required.column_name)
             FROM unnest($2::text[], $3::text[]) AS required(table_name, column_name)
            WHERE NOT EXISTS (
              SELECT 1
                FROM information_schema.columns actual
               WHERE actual.table_schema = 'public'
                 AND actual.table_name = required.table_name
                 AND actual.column_name = required.column_name
            )
            ORDER BY required.table_name, required.column_name
         ) AS missing_columns`,
      [
        [...requiredTables],
        requiredColumns.map(([table]) => table),
        requiredColumns.map(([, column]) => column),
      ]
    );

    const row = result.rows[0];
    let latestMigration: string | null = null;
    if (row.has_migration_history) {
      const history = await pool.query(
        "SELECT max(version) AS latest_migration FROM schema_migrations"
      );
      latestMigration = history.rows[0]?.latest_migration ?? null;
    }

    const missingTables = row.missing_tables as string[];
    const missingColumns = row.missing_columns as string[];
    // Schema readiness is determined by the actual required tables and columns.
    // Migration history is reported separately because a clean test schema may be
    // provisioned from reviewed SQL without the application's migration runner.
    const schemaReady =
      missingTables.length === 0 &&
      missingColumns.length === 0;

    if (!schemaReady) {
      console.error("[health] database schema is incomplete", {
        latestMigration,
        missingTables,
        missingColumns,
        hasMigrationHistory: row.has_migration_history,
      });
    }

    return NextResponse.json(
      {
        status: schemaReady ? "ok" : "schema_pending",
        app: "RealtyOS",
        database: "connected",
        databaseName: row.database_name,
        checkedAt: row.checked_at,
        schema: schemaReady ? "ready" : "pending_migration",
      },
      { status: schemaReady ? 200 : 503 }
    );
  } catch (error) {
    console.error("[health] database health check failed", error);
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
