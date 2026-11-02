import { query, queryOne } from "./db";
import type { Tenant, TenantBranding, TenantSettings } from "./types";
import type { CreateTenantInput } from "./validation";

export async function getTenantById(id: string): Promise<Tenant | null> {
  return queryOne<Tenant>(
    `SELECT id, name, slug, status, plan_key AS plan_id, created_at, updated_at, 'NG'::text AS country, 'NGN'::text AS currency, 'Africa/Lagos'::text AS timezone, NULL::timestamptz AS deleted_at FROM tenants WHERE id = $1`,
    [id]
  );
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return queryOne<Tenant>(
    `SELECT id, name, slug, status, plan_key AS plan_id, created_at, updated_at, 'NG'::text AS country, 'NGN'::text AS currency, 'Africa/Lagos'::text AS timezone, NULL::timestamptz AS deleted_at FROM tenants WHERE slug = $1`,
    [slug]
  );
}

export async function createTenant(
  input: CreateTenantInput,
  ownerUserId: string
): Promise<Tenant> {
  const clientResult = await query(
    `WITH new_tenant AS (
       INSERT INTO tenants (name, slug)
       VALUES ($1, $2)
       RETURNING *
     ),
     branding AS (
       INSERT INTO tenant_branding (tenant_id)
       SELECT id FROM new_tenant
     ),
     settings AS (
       INSERT INTO tenant_settings (tenant_id, settings)
       SELECT id, jsonb_build_object('country', $3, 'currency', $4, 'timezone', $5) FROM new_tenant
     ),
     membership AS (
       INSERT INTO tenant_memberships (tenant_id, user_id, role, status)
       SELECT id, $6, 'owner', 'active' FROM new_tenant
     )
     SELECT id, name, slug, status, plan_key AS plan_id, created_at, updated_at,
            'NG'::text AS country, 'NGN'::text AS currency,
            'Africa/Lagos'::text AS timezone, NULL::timestamptz AS deleted_at
       FROM new_tenant`,
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
    `SELECT ts.tenant_id,
            COALESCE(ts.settings->>'contact_email', t.contact_email) AS contact_email,
            COALESCE(ts.settings->>'contact_phone', t.contact_phone) AS contact_phone,
            ts.settings->>'address' AS address,
            ts.settings->>'city' AS city,
            ts.settings->>'state' AS state,
            COALESCE(ts.settings->'social_links', '{}'::jsonb) AS social_links,
            ts.seo_settings->>'title' AS seo_title,
            ts.seo_settings->>'description' AS seo_description,
            t.custom_domain, false AS domain_verified,
            (t.status = 'active') AS published, ts.updated_at
       FROM tenant_settings ts JOIN tenants t ON t.id = ts.tenant_id
      WHERE ts.tenant_id = $1`,
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

export async function updateTenantSettings(
  tenantId: string,
  data: Partial<{
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    seo_title: string | null;
    seo_description: string | null;
    custom_domain: string | null;
    published: boolean;
  }>
): Promise<TenantSettings | null> {
  return queryOne<TenantSettings>(
    `WITH tenant_update AS (
       UPDATE tenants SET custom_domain = COALESCE($9, custom_domain)
        WHERE id = $1
     ),
     settings_update AS (
       UPDATE tenant_settings
          SET settings = settings || jsonb_strip_nulls(jsonb_build_object(
                'contact_email', $2, 'contact_phone', $3, 'address', $4,
                'city', $5, 'state', $6, 'published', $10
              )),
              seo_settings = seo_settings || jsonb_strip_nulls(jsonb_build_object(
                'title', $7, 'description', $8
              )),
              updated_at = now()
        WHERE tenant_id = $1
        RETURNING tenant_id, settings, seo_settings, updated_at
     )
     SELECT su.tenant_id,
            COALESCE(su.settings->>'contact_email', t.contact_email) AS contact_email,
            COALESCE(su.settings->>'contact_phone', t.contact_phone) AS contact_phone,
            su.settings->>'address' AS address,
            su.settings->>'city' AS city,
            su.settings->>'state' AS state,
            COALESCE(su.settings->'social_links', '{}'::jsonb) AS social_links,
            su.seo_settings->>'title' AS seo_title,
            su.seo_settings->>'description' AS seo_description,
            t.custom_domain, false AS domain_verified,
            COALESCE((su.settings->>'published')::boolean, t.status = 'active') AS published,
            su.updated_at
       FROM settings_update su JOIN tenants t ON t.id = su.tenant_id`,
    [
      tenantId,
      data.contact_email ?? null,
      data.contact_phone ?? null,
      data.address ?? null,
      data.city ?? null,
      data.state ?? null,
      data.seo_title ?? null,
      data.seo_description ?? null,
      data.custom_domain ?? null,
      data.published ?? null,
    ]
  );
}
