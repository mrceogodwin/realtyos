"use server";

import { revalidatePath } from "next/cache";
import { createLeadSchema, updateLeadStatusSchema } from "@/lib/validation";
import { createLead as insertLead, updateLeadStatus } from "@/lib/leads";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { LeadStatus } from "@/lib/types";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createLeadAction(
  raw: unknown
): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = createLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    const lead = await insertLead(scope.tenant.id, parsed.data);
    revalidatePath("/app/leads");
    revalidatePath("/app");
    return { ok: true, data: lead };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet. Set DATABASE_URL and run the migration.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[createLeadAction]", err);
    return { ok: false, error: "Failed to create lead", code: "SERVER" };
  }
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  const parsed = updateLeadStatusSchema.safeParse({ leadId, status });
  if (!parsed.success) {
    return { ok: false, error: "Invalid record ID or status", code: "VALIDATION" };
  }

  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  try {
    const lead = await updateLeadStatus(scope.tenant.id, parsed.data.leadId, parsed.data.status);
    if (!lead) {
      return { ok: false, error: "Lead not found in this workspace", code: "NOT_FOUND" };
    }
    revalidatePath("/app/leads");
    return { ok: true, data: lead };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error: "Database is not configured yet.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[updateLeadStatusAction]", err);
    return { ok: false, error: "Failed to update lead", code: "SERVER" };
  }
}
