"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateTenantBranding, updateTenantSettings } from "@/lib/tenants";
import { DatabaseNotConfiguredError } from "@/lib/db";

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
  custom_domain: z.string().max(200).optional().nullable(),
});

export async function saveBrandingAction(
  raw: unknown,
  tenantId: string
): Promise<ActionResult> {
  if (!tenantId || typeof tenantId !== "string") {
    return { ok: false, error: "Tenant context is required", code: "NO_TENANT" };
  }

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

    const branding = await updateTenantBranding(tenantId, {
      primary_color,
      secondary_color,
      accent_color,
      hero_title,
      hero_subtitle,
    });

    const settings = await updateTenantSettings(tenantId, {
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
