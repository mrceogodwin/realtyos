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

export async function switchWorkspaceAction(tenantId: string): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
    return { ok: false, error: "Invalid workspace", code: "VALIDATION" };
  }
  try {
    const membership = await getTenantMembershipForUser(tenantId, context.user.id);
    if (!membership || membership.status !== "active") {
      return { ok: false, error: "You do not have active access to that workspace.", code: "FORBIDDEN" };
    }
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("realtyos_active_tenant", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath("/app");
    return { ok: true, data: { tenantId } };
  } catch (error) {
    console.error("[switchWorkspaceAction]", error);
    return { ok: false, error: "Unable to switch workspace", code: "SERVER" };
  }
}

async function getTenantMembershipForUser(tenantId: string, userId: string) {
  const { queryOne } = await import("@/lib/db");
  return queryOne<{ id: string; tenant_id: string; user_id: string; status: string }>(
    `SELECT m.id, m.tenant_id, m.user_id, m.status
       FROM tenant_memberships m
       JOIN tenants t ON t.id = m.tenant_id
      WHERE m.tenant_id = $1 AND m.user_id = $2
        AND t.status = 'active' AND t.deleted_at IS NULL
      LIMIT 1`,
    [tenantId, userId]
  );
}
