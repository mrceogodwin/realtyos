"use server";

import { revalidatePath } from "next/cache";
import { createPropertySchema } from "@/lib/validation";
import { createProperty as insertProperty } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/**
 * Temporary: until authentication is implemented, this action accepts an explicit
 * tenantId. Once auth lands, tenantId will be resolved from the session only.
 * Never trust a tenantId that comes from the client in production.
 */
export async function createPropertyAction(
  raw: unknown,
  tenantId: string
): Promise<ActionResult> {
  if (!tenantId || typeof tenantId !== "string") {
    return { ok: false, error: "Tenant context is required", code: "NO_TENANT" };
  }

  const parsed = createPropertySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    // Generate a slug if one was not provided cleanly
    const input = {
      ...parsed.data,
      slug:
        parsed.data.slug ||
        parsed.data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 80),
    };

    const property = await insertProperty(tenantId, input);
    revalidatePath("/");
    return { ok: true, data: property };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet. Set DATABASE_URL and run the migration.",
        code: "DB_NOT_CONFIGURED",
      };
    }

    // Unique violation (duplicate slug within tenant)
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return {
        ok: false,
        error: "A property with this slug already exists in your workspace.",
        code: "DUPLICATE_SLUG",
      };
    }

    console.error("[createPropertyAction]", err);
    return { ok: false, error: "Failed to create property", code: "SERVER" };
  }
}
