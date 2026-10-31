import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  description: z.string().max(10000).optional().nullable(),
  listing_type: z.enum(["sale", "rent", "lease", "short_let"]),
  property_type_id: z.string().uuid().optional().nullable(),
  status: z
    .enum(["draft", "published", "under_offer", "sold", "rented", "archived"])
    .default("draft"),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default("NGN"),
  price_period: z.enum(["month", "year", "night", "week"]).optional().nullable(),
  bedrooms: z.number().int().nonnegative().optional().nullable(),
  bathrooms: z.number().int().nonnegative().optional().nullable(),
  toilets: z.number().int().nonnegative().optional().nullable(),
  parking_spaces: z.number().int().nonnegative().optional().nullable(),
  area_value: z.number().nonnegative().optional().nullable(),
  area_unit: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  state: z.string().max(120).optional().nullable(),
  country: z.string().length(2).default("NG"),
  features: z.array(z.string()).default([]),
  assigned_agent_id: z.string().uuid().optional().nullable(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const createLeadSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  source: z
    .enum(["website", "enquiry", "viewing_request", "manual", "referral", "other"])
    .default("website"),
  notes: z.string().max(5000).optional().nullable(),
  budget_min: z.number().nonnegative().optional().nullable(),
  budget_max: z.number().nonnegative().optional().nullable(),
  preferred_location: z.string().max(200).optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const createViewingSchema = z.object({
  property_id: z.string().uuid(),
  lead_id: z.string().uuid().optional().nullable(),
  visitor_name: z.string().min(2).max(200),
  visitor_email: z.string().email().optional().nullable(),
  visitor_phone: z.string().max(30).optional().nullable(),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480).default(60),
  notes: z.string().max(2000).optional().nullable(),
  agent_id: z.string().uuid().optional().nullable(),
});

export type CreateViewingInput = z.infer<typeof createViewingSchema>;

export const createTenantSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  country: z.string().length(2).default("NG"),
  currency: z.string().length(3).default("NGN"),
  timezone: z.string().default("Africa/Lagos"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "viewing_scheduled", "negotiating", "won", "lost", "spam"]),
});

export const updateViewingStatusSchema = z.object({
  viewingId: z.string().uuid(),
  status: z.enum(["requested", "confirmed", "rescheduled", "completed", "cancelled", "no_show"]),
});


export const rescheduleViewingSchema = z.object({
  viewingId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
});
