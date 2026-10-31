"use server";

import { revalidatePath } from "next/cache";
import { createPropertySchema } from "@/lib/validation";
import { createProperty as insertProperty, updatePropertyStatus, updateProperty } from "@/lib/properties";
import { z } from "zod";
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

const propertyStatusSchema = z.object({
  propertyId: z.string().uuid(),
  status: z.enum(["draft", "published", "under_offer", "sold", "rented", "archived"]),
});

export async function updatePropertyStatusAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "editor")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = propertyStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid property or status", code: "VALIDATION" };

  try {
    const property = await updatePropertyStatus(scope.tenant.id, parsed.data.propertyId, parsed.data.status);
    if (!property) return { ok: false, error: "Property not found in this workspace", code: "NOT_FOUND" };
    revalidatePath("/app/properties");
    revalidatePath("/app");
    revalidatePath(`/s/${scope.tenant.slug}`);
    revalidatePath(`/s/${scope.tenant.slug}/${property.slug}`);
    return { ok: true, data: { id: property.id, status: property.status } };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    console.error("[updatePropertyStatusAction]", error);
    return { ok: false, error: "Could not update property status", code: "SERVER" };
  }
}

const updatePropertySchema = z.object({
  propertyId: z.string().uuid(),
  property: createPropertySchema,
});

export async function updatePropertyAction(raw: unknown): Promise<ActionResult> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };
  let scope;
  try { scope = requireTenant(context); } catch { return { ok: false, error: "Active workspace required", code: "NO_TENANT" }; }
  if (!hasMinimumRole(scope.membership, "editor")) return { ok: false, error: "Insufficient permissions", code: "FORBIDDEN" };

  const parsed = updatePropertySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; "), code: "VALIDATION" };

  try {
    const property = await updateProperty(scope.tenant.id, parsed.data.propertyId, parsed.data.property);
    if (!property) return { ok: false, error: "Property not found in this workspace", code: "NOT_FOUND" };
    revalidatePath("/app/properties");
    revalidatePath("/app");
    revalidatePath(`/s/${scope.tenant.slug}`);
    revalidatePath(`/s/${scope.tenant.slug}/${property.slug}`);
    return { ok: true, data: property };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return { ok: false, error: "Database is not configured yet.", code: "DB_NOT_CONFIGURED" };
    const message = error instanceof Error ? error.message : "";
    if (message.includes("unique") || message.includes("duplicate")) return { ok: false, error: "A property with this slug already exists in your workspace.", code: "DUPLICATE_SLUG" };
    console.error("[updatePropertyAction]", error);
    return { ok: false, error: "Could not update property", code: "SERVER" };
  }
}
