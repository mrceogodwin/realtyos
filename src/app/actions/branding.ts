"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTenantBranding, updateTenantSettings } from "@/lib/tenants";
import { DatabaseNotConfiguredError, withTransaction } from "@/lib/db";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<
  T = unknown
> =
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
  custom_domain: z.string().trim().max(253).regex(/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,63}$/).optional().nullable(),
});

export async function saveBrandingAction(
  raw: unknown,
  tenantId: string
): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "admin")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = brandingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    const {
      primary_color,
      secondary_color,
      accent_color,
      hero_title,
      hero_subtitle,
      seo_title,
      seo_description,
      custom_domain,
    } = parsed.data;

    const branding = await updateTenantBranding(scope.tenant.id, {
      primary_color,
      secondary_color,
      accent_color,
      hero_title,
      hero_subtitle,
    });

    const settings = await updateTenantSettings(scope.tenant.id, {
      seo_title,
      seo_description,
      custom_domain,
    });

    revalidatePath("/app/branding");
    return { ok: true, data: { branding, settings } };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet. Set DATABASE_URL and run the migration.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[saveBrandingAction]", err);
    return { ok: false, error: "Failed to save branding", code: "SERVER" };
  }
}
