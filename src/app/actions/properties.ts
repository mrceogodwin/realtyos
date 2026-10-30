"use server";

import { revalidatePath } from "next/cache";
import { createPropertySchema } from "@/lib/validation";
import { createProperty as insertProperty } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export async function createPropertyAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "editor")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = createPropertySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; "), code: "VALIDATION" };
  }

  try {
    const property = await insertProperty(scope.tenant.id, parsed.data, scope.user.id);
    revalidatePath("/app/properties");
    revalidatePath("/app");
    revalidatePath("/");
    return { ok: true, data: property };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) return { ok: false, error: "A property with this slug already exists in your workspace.", code: "DUPLICATE_SLUG" };
    console.error("[createPropertyAction]", error);
    return { ok: false, error: "Failed to create property", code: "SERVER" };
  }
}
