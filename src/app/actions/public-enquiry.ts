"use server";

import { z } from "zod";
import { getTenantBySlug } from "@/lib/tenants";
import { getPropertyBySlug } from "@/lib/properties";
import { createLead } from "@/lib/leads";
import { DatabaseNotConfiguredError } from "@/lib/db";

export type ActionResult<
  T = unknown
> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const enquirySchema = z.object({
  workspaceSlug: z.string().min(2).max(60),
  propertySlug: z.string().min(2).max(120).optional().nullable(),
  full_name: z.string().min(2).max(200),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable().or(z.literal("")),
  notes: z.string().max(2000).optional().nullable().or(z.literal("")),
});

/**
 * Public intake. Tenant is resolved only from the workspace slug on the server.
 * Clients cannot pass a tenantId.
 */
export async function createPublicEnquiryAction(
  raw: unknown
): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION",
    };
  }

  const { workspaceSlug, propertySlug, full_name, email, phone, notes } =
    parsed.data;

  if (!email && !phone) {
    return {
      ok: false,
      error: "Provide at least an email or phone number.",
      code: "VALIDATION",
    };
  }

  try {
    const tenant = await getTenantBySlug(workspaceSlug);
    if (!tenant || tenant.status !== "active") {
      return {
        ok: false,
        error: "This agency workspace is not available.",
        code: "TENANT_NOT_FOUND",
      };
    }

    let propertyId: string | null = null;
    if (propertySlug) {
      const property = await getPropertyBySlug(tenant.id, propertySlug);
      if (property && property.status === "published") {
        propertyId = property.id;
      }
    }

    const lead = await createLead(tenant.id, {
      full_name,
      email: email || null,
      phone: phone || null,
      property_id: propertyId,
      source: "website",
      notes: notes || null,
    });

    return { ok: true, data: { id: lead.id } };
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return {
        ok: false,
        error:
          "Enquiries will be stored when the database is connected. DATABASE_URL is not set yet.",
        code: "DB_NOT_CONFIGURED",
      };
    }
    console.error("[createPublicEnquiryAction]", err);
    return { ok: false, error: "Could not send enquiry. Try again.", code: "SERVER" };
  }
}
