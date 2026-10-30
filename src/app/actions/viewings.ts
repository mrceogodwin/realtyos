"use server";

import { revalidatePath } from "next/cache";
import { createViewingSchema, updateViewingStatusSchema } from "@/lib/validation";
import {
  createViewing as insertViewing,
  updateViewingStatus,
} from "@/lib/viewings";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { ViewingStatus } from "@/lib/types";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createViewingAction(
  raw: unknown
): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = createViewingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    const viewing = await insertViewing(scope.tenant.id, parsed.data, scope.user.id);
    revalidatePath("/app/viewings");
    revalidatePath("/app");
    return { ok: true, data: viewing };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet. Set DATABASE_URL and run the migration.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[createViewingAction]", err);
    return { ok: false, error: "Failed to schedule viewing", code: "SERVER" };
  }
}

export async function updateViewingStatusAction(
  viewingId: string,
  status: ViewingStatus
): Promise<ActionResult> {
  const parsed = updateViewingStatusSchema.safeParse({ viewingId, status });
  if (!parsed.success) {
    return { ok: false, error: "Invalid record ID or status", code: "VALIDATION" };
  }

  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  try {
    const viewing = await updateViewingStatus(scope.tenant.id, parsed.data.viewingId, parsed.data.status);
    if (!viewing) {
      return {
        ok: false,
        error: "Viewing not found in this workspace",
        code: "NOT_FOUND",
      };
    }
    revalidatePath("/app/viewings");
    return { ok: true, data: viewing };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[updateViewingStatusAction]", err);
    return { ok: false, error: "Failed to update viewing", code: "SERVER" };
  }
}
