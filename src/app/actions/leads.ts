"use server";

import { revalidatePath } from "next/cache";
import { createLeadSchema } from "@/lib/validation";
import { createLead as insertLead, updateLeadStatus } from "@/lib/leads";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { LeadStatus } from "@/lib/types";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createLeadAction(
  raw: unknown,
  tenantId: string
): Promise<ActionResult> {
  if (!tenantId || typeof tenantId !== "string") {
    return { ok: false, error: "Tenant context is required", code: "NO_TENANT" };
  }

  const parsed = createLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  try {
    const lead = await insertLead(tenantId, parsed.data);
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
  tenantId: string,
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  if (!tenantId || !leadId) {
    return { ok: false, error: "Tenant and lead are required", code: "NO_CONTEXT" };
  }

  try {
    const lead = await updateLeadStatus(tenantId, leadId, status);
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
