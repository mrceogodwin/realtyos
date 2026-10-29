/**
 * Core domain types for RealtyOS.
 * These mirror the database schema and are the single source of truth for the app.
 */

export type TenantStatus = "active" | "suspended" | "pending" | "deleted";
export type MembershipRole = "owner" | "admin" | "agent" | "editor" | "viewer";
export type MembershipStatus = "active" | "invited" | "suspended" | "revoked";
export type PlatformRole = "super_admin" | "support" | "user";
export type ListingType = "sale" | "rent" | "lease" | "short_let";
export type PropertyStatus =
  | "draft"
  | "published"
  | "under_offer"
  | "sold"
  | "rented"
  | "archived";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing_scheduled"
  | "negotiating"
  | "won"
  | "lost"
  | "spam";
export type LeadSource =
  | "website"
  | "enquiry"
  | "viewing_request"
  | "manual"
  | "referral"
  | "other";
export type ViewingStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no_show";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  country: string;
  currency: string;
  timezone: string;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TenantBranding {
  tenant_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  updated_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  social_links: Record<string, string>;
  seo_title: string | null;
  seo_description: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  published: boolean;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  auth_provider_id: string | null;
  email: string;
  email_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  status: "active" | "suspended" | "deleted";
  platform_role: PlatformRole;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyType {
  id: string;
  slug: string;
  name: string;
  category: "residential" | "commercial" | "land" | "other";
  sort_order: number;
}

export interface Property {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  listing_type: ListingType;
  property_type_id: string | null;
  status: PropertyStatus;
  price: number;
  currency: string;
  price_period: "month" | "year" | "night" | "week" | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parking_spaces: number | null;
  area_value: number | null;
  area_unit: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  features: string[];
  assigned_agent_id: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  tenant_id: string;
  storage_key: string;
  url: string | null;
  media_type: "image" | "video" | "floor_plan" | "document";
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  property_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  assigned_agent_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyViewing {
  id: string;
  tenant_id: string;
  property_id: string;
  lead_id: string | null;
  agent_id: string | null;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: ViewingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_code: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: string | null;
  provider_subscription_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Context available after authentication + tenant resolution */
export interface AuthContext {
  user: UserProfile;
  membership: TenantMembership | null;
  tenant: Tenant | null;
  isSuperAdmin: boolean;
}
