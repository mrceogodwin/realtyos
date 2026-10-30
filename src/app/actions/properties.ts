"use server";

import { revalidatePath } from "next/cache";
import { createPropertySchema } from "@/lib/validation";
import { createProperty as insertProperty } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/**
 * Workspace scope is always derived from the authenticated server session.
 */
export async function createPropertyAction(
  raw: unknown
): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "editor")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

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

    const property = await insertProperty(scope.tenant.id, input, scope.user.id);
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
