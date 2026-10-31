"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DatabaseNotConfiguredError, withTransaction } from "@/lib/db";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const brandingSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  hero_title: z.string().max(200).optional().nullable(),
  hero_subtitle: z.string().max(500).optional().nullable(),
  seo_title: z.string().max(120).optional().nullable(),
  seo_description: z.string().max(300).optional().nullable(),
  published: z.boolean().optional(),
  custom_domain: z.string().trim().max(253)
    .regex(/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,63}$/)
    .optional().nullable(),
});

export async function saveBrandingAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };

  let scope;
  try {
    scope = requireTenant(context);
  } catch {
    return { ok: false, error: "Active workspace required", code: "NO_TENANT" };
  }
  if (!hasMinimumRole(scope.membership, "admin")) {
    return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };
  }

  const parsed = brandingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; "), code: "VALIDATION" };
  }

  try {
    const {
      primary_color, secondary_color, accent_color,
      hero_title, hero_subtitle, seo_title, seo_description, custom_domain, published,
    } = parsed.data;

    const result = await withTransaction(async (client) => {
      const branding = await client.query(
        `UPDATE tenant_branding SET
          primary_color = COALESCE($2, primary_color),
          secondary_color = COALESCE($3, secondary_color),
          accent_color = COALESCE($4, accent_color),
          hero_title = COALESCE($5, hero_title),
          hero_subtitle = COALESCE($6, hero_subtitle),
          updated_at = now()
         WHERE tenant_id = $1 RETURNING *`,
        [scope.tenant.id, primary_color, secondary_color, accent_color, hero_title, hero_subtitle]
      );
      const settings = await client.query(
        `UPDATE tenant_settings SET
          seo_title = COALESCE($2, seo_title),
          seo_description = COALESCE($3, seo_description),
          custom_domain = CASE WHEN $4::text IS DISTINCT FROM custom_domain THEN $4 ELSE custom_domain END,
          domain_verified = CASE WHEN $4::text IS DISTINCT FROM custom_domain THEN false ELSE domain_verified END,
          published = COALESCE($5, published),
          updated_at = now()
         WHERE tenant_id = $1 RETURNING *`,
        [scope.tenant.id, seo_title, seo_description, custom_domain, published]
      );
      if (!branding.rowCount || !settings.rowCount) throw new Error("WORKSPACE_BRANDING_NOT_INITIALIZED");
      return { branding: branding.rows[0], settings: settings.rows[0] };
    });

    revalidatePath("/app/branding");
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return { ok: false, error: "Database is not configured. Configure DATABASE_URL and apply migrations.", code: "DB_NOT_CONFIGURED" };
    }
    console.error("[saveBrandingAction]", error);
    return { ok: false, error: "Failed to save branding", code: "SERVER" };
  }
}
