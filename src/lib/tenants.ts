import { query, queryOne } from "./db";
import type { Tenant, TenantBranding, TenantSettings } from "./types";
import type { CreateTenantInput } from "./validation";

export async function getTenantById(id: string): Promise<Tenant | null> {
  return queryOne<Tenant>(
    `SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return queryOne<Tenant>(
    `SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL`,
    [slug]
  );
}

export async function createTenant(
  input: CreateTenantInput,
  ownerUserId: string
): Promise<Tenant> {
  // Create tenant + branding + settings + owner membership in one transaction
  const clientResult = await query(
    `WITH new_tenant AS (
       INSERT INTO tenants (name, slug, country, currency, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *
     ),
     branding AS (
       INSERT INTO tenant_branding (tenant_id)
       SELECT id FROM new_tenant
     ),
     settings AS (
       INSERT INTO tenant_settings (tenant_id)
       SELECT id FROM new_tenant
     ),
     membership AS (
       INSERT INTO tenant_memberships (tenant_id, user_id, role, status, accepted_at)
       SELECT id, $6, 'owner', 'active', now() FROM new_tenant
     )
     SELECT * FROM new_tenant`,
    [
      input.name,
      input.slug,
      input.country ?? "NG",
      input.currency ?? "NGN",
      input.timezone ?? "Africa/Lagos",
      ownerUserId,
    ]
  );

  return clientResult.rows[0] as Tenant;
}

export async function getTenantBranding(
  tenantId: string
): Promise<TenantBranding | null> {
  return queryOne<TenantBranding>(
    `SELECT * FROM tenant_branding WHERE tenant_id = $1`,
    [tenantId]
  );
}

export async function getTenantSettings(
  tenantId: string
): Promise<TenantSettings | null> {
  return queryOne<TenantSettings>(
    `SELECT * FROM tenant_settings WHERE tenant_id = $1`,
    [tenantId]
  );
}

export async function updateTenantBranding(
  tenantId: string,
  data: Partial<{
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    hero_title: string | null;
    hero_subtitle: string | null;
  }>
): Promise<TenantBranding | null> {
  return queryOne<TenantBranding>(
    `UPDATE tenant_branding
     SET
       logo_url = COALESCE($2, logo_url),
       favicon_url = COALESCE($3, favicon_url),
       primary_color = COALESCE($4, primary_color),
       secondary_color = COALESCE($5, secondary_color),
       accent_color = COALESCE($6, accent_color),
       hero_title = COALESCE($7, hero_title),
       hero_subtitle = COALESCE($8, hero_subtitle),
       updated_at = now()
     WHERE tenant_id = $1
     RETURNING *`,
    [
      tenantId,
      data.logo_url ?? null,
      data.favicon_url ?? null,
      data.primary_color ?? null,
      data.secondary_color ?? null,
      data.accent_color ?? null,
      data.hero_title ?? null,
      data.hero_subtitle ?? null,
    ]
  );
}
