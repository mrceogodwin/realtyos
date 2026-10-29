"use server";

import { revalidatePath } from "next/cache";
import { createViewingSchema } from "@/lib/validation";
import {
  createViewing as insertViewing,
  updateViewingStatus,
} from "@/lib/viewings";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { ViewingStatus } from "@/lib/types";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createViewingAction(
  raw: unknown,
  tenantId: string
): Promise<ActionResult> {
  if (!tenantId || typeof tenantId !== "string") {
    return { ok: false, error: "Tenant context is required", code: "NO_TENANT" };
  }

  const parsed = createViewingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    const viewing = await insertViewing(tenantId, parsed.data);
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
  tenantId: string,
  viewingId: string,
  status: ViewingStatus
): Promise<ActionResult> {
  if (!tenantId || !viewingId) {
    return { ok: false, error: "Tenant and viewing are required", code: "NO_CONTEXT" };
  }

  try {
    const viewing = await updateViewingStatus(tenantId, viewingId, status);
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
