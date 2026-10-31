"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { getTenantBySlug, getTenantSettings } from "@/lib/tenants";
import { getPropertyBySlug } from "@/lib/properties";
import { createLead } from "@/lib/leads";
import { DatabaseNotConfiguredError, queryOne } from "@/lib/db";

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
  website_url: z.string().max(500).optional().nullable().or(z.literal("")),
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

  const { workspaceSlug, propertySlug, full_name, email, phone, notes, website_url } =
    parsed.data;

  // Quietly accept bot submissions without storing them or revealing the honeypot.
  if (website_url) return { ok: true, data: { id: "accepted" } };

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

    const settings = await getTenantSettings(tenant.id);
    if (settings?.published !== true) {
      return {
        ok: false,
        error: "This agency website is not currently accepting enquiries.",
        code: "WEBSITE_UNPUBLISHED",
      };
    }

    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const clientIp = requestHeaders.get("x-real-ip") || forwardedFor?.split(",")[0]?.trim() || "unknown";
    const rateLimitSecret = process.env.REALTYOS_RATE_LIMIT_SECRET || process.env.AUTH_SECRET;
    if (!rateLimitSecret) {
      console.error("[createPublicEnquiryAction] Rate-limit secret is not configured");
      return { ok: false, error: "Enquiry service is temporarily unavailable.", code: "CONFIG" };
    }
    const bucketKey = createHmac("sha256", rateLimitSecret)
      .update(`${tenant.id}:${clientIp}`)
      .digest("hex");
    const rateLimit = await queryOne<{ request_count: number }>(
      `INSERT INTO public_enquiry_rate_limits (bucket_key, window_started_at, request_count, expires_at)
       VALUES ($1, now(), 1, now() + interval '10 minutes')
       ON CONFLICT (bucket_key) DO UPDATE
         SET window_started_at = CASE
               WHEN public_enquiry_rate_limits.window_started_at <= now() - interval '10 minutes' THEN now()
               ELSE public_enquiry_rate_limits.window_started_at
             END,
             request_count = CASE
               WHEN public_enquiry_rate_limits.window_started_at <= now() - interval '10 minutes' THEN 1
               ELSE public_enquiry_rate_limits.request_count + 1
             END,
             expires_at = now() + interval '10 minutes'
       RETURNING request_count`,
      [bucketKey]
    );
    if (!rateLimit || Number(rateLimit.request_count) > 5) {
      return { ok: false, error: "Too many enquiries. Please try again in a few minutes.", code: "RATE_LIMITED" };
    }

    let propertyId: string | null = null;
    if (propertySlug) {
      const property = await getPropertyBySlug(tenant.id, propertySlug);
      if (!property || property.status !== "published") {
        return {
          ok: false,
          error: "This property is no longer available for enquiries.",
          code: "PROPERTY_UNAVAILABLE",
        };
      }
      propertyId = property.id;
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
