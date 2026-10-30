"use server";

import { revalidatePath } from "next/cache";
import { createTenantSchema } from "@/lib/validation";
import { createTenant, getTenantBySlug } from "@/lib/tenants";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getCurrentAuthContext } from "@/lib/auth";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createWorkspaceAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) {
    return {
      ok: false,
      error: "Sign in with a verified Google account before creating a workspace.",
      code: "AUTH_REQUIRED",
    };
  }

  const parsed = createTenantSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
      code: "VALIDATION",
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

    // The owner identity is always derived from the verified server session.
    const tenant = await createTenant(parsed.data, context.user.id);
    revalidatePath("/app");
    revalidatePath("/onboarding");
    revalidatePath(`/s/${tenant.slug}`);
    return { ok: true, data: tenant };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured. Configure DATABASE_URL and apply the database migrations.",
        code: "DB_NOT_CONFIGURED",
      };
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return {
        ok: false,
        error: "That workspace URL is already taken.",
        code: "SLUG_TAKEN",
      };
    }

    console.error("[createWorkspaceAction]", error);
    return { ok: false, error: "Failed to create workspace", code: "SERVER" };
  }
}
