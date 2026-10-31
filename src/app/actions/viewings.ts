"use server";

import { revalidatePath } from "next/cache";
import { createViewingSchema, updateViewingStatusSchema, rescheduleViewingSchema } from "@/lib/validation";
import {
  createViewing as insertViewing,
  updateViewingStatus,
  recordViewingActivity,
  rescheduleViewing,
  ViewingConflictError,
  ViewingStatusTransitionError,
} from "@/lib/viewings";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { PropertyViewing, ViewingStatus } from "@/lib/types";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

async function recordViewingActivitySafely(tenantId: string, actorId: string, viewingId: string, action: string, metadata: Record<string, unknown>) {
  try {
    await recordViewingActivity(tenantId, actorId, viewingId, action, metadata);
  } catch (error) {
    // The viewing mutation has already committed; do not report it as failed because audit logging failed.
    console.error("[viewing activity log]", error);
  }
}

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

  if (new Date(parsed.data.scheduled_at).getTime() <= Date.now()) return { ok: false, error: "Viewing must be scheduled for a future date and time", code: "VALIDATION" };

  try {
    const viewing = await insertViewing(scope.tenant.id, parsed.data, scope.user.id);
    await recordViewingActivitySafely(scope.tenant.id, scope.user.id, viewing.id, "viewing.scheduled", { propertyId: viewing.property_id, scheduledAt: viewing.scheduled_at });
    revalidatePath("/app/viewings");
    revalidatePath("/app");
    return { ok: true, data: viewing };
  } catch (err) {
    if (err instanceof ViewingConflictError) return { ok: false, error: err.message, code: "SCHEDULE_CONFLICT" };
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
    await recordViewingActivitySafely(scope.tenant.id, scope.user.id, viewing.id, "viewing.status_changed", { status: parsed.data.status });
    revalidatePath("/app/viewings");
    return { ok: true, data: viewing };
  } catch (err) {
    if (err instanceof ViewingStatusTransitionError) return { ok: false, error: err.message, code: "INVALID_STATUS_TRANSITION" };
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


export async function rescheduleViewingAction(raw: unknown): Promise<ActionResult<PropertyViewing>> {
  const parsed = rescheduleViewingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid rescheduling details", code: "VALIDATION" };
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };
  if (new Date(parsed.data.scheduledAt).getTime() <= Date.now()) return { ok: false, error: "New viewing time must be in the future", code: "VALIDATION" };
  try {
    const viewing = await rescheduleViewing(scope.tenant.id, parsed.data.viewingId, parsed.data.scheduledAt, parsed.data.durationMinutes);
    if (!viewing) return { ok: false, error: "Viewing not found in this workspace", code: "NOT_FOUND" };
    await recordViewingActivitySafely(scope.tenant.id, scope.user.id, viewing.id, "viewing.rescheduled", { scheduledAt: viewing.scheduled_at, durationMinutes: viewing.duration_minutes });
    revalidatePath("/app/viewings");
    revalidatePath("/app");
    return { ok: true, data: viewing };
  } catch (err) {
    if (err instanceof ViewingConflictError) return { ok: false, error: err.message, code: "SCHEDULE_CONFLICT" };
    if (err instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    console.error("[rescheduleViewingAction]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reschedule viewing", code: "SERVER" };
  }
}
