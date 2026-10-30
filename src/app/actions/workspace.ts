"use server";

import { revalidatePath } from "next/cache";
import { createTenantSchema } from "@/lib/validation";
import { createTenant, getTenantBySlug } from "@/lib/tenants";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getCurrentAuthContext } from "@/lib/auth";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/**
 * Creates a tenant workspace. Until full auth is live, ownerUserId is optional
 * and must be replaced by the authenticated user id from session.
 */
export async function createWorkspaceAction(
  raw: unknown,
  ownerUserId?: string
): Promise<ActionResult> {
  const parsed = createTenantSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  const context = await getCurrentAuthContext();
  if (!context) {
    return {
      ok: false,
      error:
        "Sign-in is required to create a workspace. Auth is scaffolded; connect AUTH_SECRET and complete login first.",
      code: "AUTH_REQUIRED",
    };
  }

  try {
    const existing = await getTenantBySlug(parsed.data.slug);
    if (existing) {
      return {
        ok: false,
        error: "That workspace URL is already taken. Choose another slug.",
        code: "SLUG_TAKEN",
      };
    }

    const tenant = await createTenant(parsed.data, context.user.id);
    revalidatePath("/app");
    revalidatePath(`/s/${tenant.slug}`);
    return { ok: true, data: tenant };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error:
          "Database is not configured yet. Set DATABASE_URL and run db/migrations/0001_initial.sql.",
        code: "DB_NOT_CONFIGURED",
      };
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return {
        ok: false,
        error: "That workspace URL is already taken.",
        code: "SLUG_TAKEN",
      };
    }

    console.error("[createWorkspaceAction]", err);
    return { ok: false, error: "Failed to create workspace", code: "SERVER" };
  }
}
