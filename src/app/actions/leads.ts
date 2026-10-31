"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLeadSchema, updateLeadStatusSchema } from "@/lib/validation";
import { createLead as insertLead, updateLeadStatus, updateLeadWorkflow, recordLeadActivity } from "@/lib/leads";
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
    await recordLeadActivity(scope.tenant.id, scope.user.id, lead.id, "lead.created", { source: parsed.data.source ?? "manual" });
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
    if (lead) await recordLeadActivity(scope.tenant.id, scope.user.id, lead.id, "lead.status_changed", { status: parsed.data.status });
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

const leadWorkflowSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "viewing_scheduled", "negotiating", "won", "lost", "spam"]),
  assignedAgentId: z.string().uuid().nullable(),
  followUpAt: z.string().datetime().nullable(),
});

export async function updateLeadWorkflowAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = leadWorkflowSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; "), code: "VALIDATION" };

  try {
    const lead = await updateLeadWorkflow(scope.tenant.id, parsed.data.leadId, {
      status: parsed.data.status,
      assignedAgentId: parsed.data.assignedAgentId,
      followUpAt: parsed.data.followUpAt,
    });
    if (!lead) return { ok: false, error: "Lead not found in this workspace", code: "NOT_FOUND" };
    await recordLeadActivity(scope.tenant.id, scope.user.id, lead.id, "lead.workflow_updated", { status: parsed.data.status, assignedAgentId: parsed.data.assignedAgentId, followUpAt: parsed.data.followUpAt });
    revalidatePath("/app/leads");
    revalidatePath("/app");
    return { ok: true, data: lead };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    console.error("[updateLeadWorkflowAction]", error);
    return { ok: false, error: "Could not update lead workflow", code: "SERVER" };
  }
}


const leadNoteSchema = z.object({ leadId: z.string().uuid(), note: z.string().trim().min(1).max(5000) });

export async function addLeadNoteAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "agent")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };
  const parsed = leadNoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a note of up to 5,000 characters.", code: "VALIDATION" };
  try {
    await recordLeadActivity(scope.tenant.id, scope.user.id, parsed.data.leadId, "lead.note_added", { note: parsed.data.note });
    revalidatePath("/app/leads");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    console.error("[addLeadNoteAction]", error);
    return { ok: false, error: "Could not save lead note", code: "SERVER" };
  }
}
