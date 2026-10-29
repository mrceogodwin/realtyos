-- RealtyOS Initial Schema
-- Multi-tenant real-estate SaaS foundation
-- Apply with: psql $DATABASE_URL -f db/migrations/0001_initial.sql
-- Or via your preferred migration runner.

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PLATFORM & TENANTS
-- ============================================================

CREATE TABLE platform_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               TEXT NOT NULL UNIQUE,
  value             JSONB NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'pending', 'deleted')),
  country           TEXT NOT NULL DEFAULT 'NG',
  currency          TEXT NOT NULL DEFAULT 'NGN',
  timezone          TEXT NOT NULL DEFAULT 'Africa/Lagos',
  plan_id           UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX tenants_slug_unique ON tenants (slug) WHERE deleted_at IS NULL;
CREATE INDEX tenants_status_idx ON tenants (status);

CREATE TABLE tenant_branding (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url          TEXT,
  favicon_url       TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#12634b',
  secondary_color   TEXT NOT NULL DEFAULT '#ffffff',
  accent_color      TEXT NOT NULL DEFAULT '#c6a36b',
  hero_title        TEXT,
  hero_subtitle     TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_settings (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  contact_email     TEXT,
  contact_phone     TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  social_links      JSONB NOT NULL DEFAULT '{}',
  seo_title         TEXT,
  seo_description   TEXT,
  custom_domain     TEXT,
  domain_verified   BOOLEAN NOT NULL DEFAULT false,
  published         BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tenant_settings_custom_domain_unique
  ON tenant_settings (custom_domain)
  WHERE custom_domain IS NOT NULL AND domain_verified = true;

-- ============================================================
-- USERS & MEMBERSHIPS
-- ============================================================

CREATE TABLE user_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider_id  TEXT UNIQUE,           -- maps to external auth provider subject
  email             TEXT NOT NULL,
  email_verified    BOOLEAN NOT NULL DEFAULT false,
  full_name         TEXT,
  avatar_url        TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'deleted')),
  platform_role     TEXT NOT NULL DEFAULT 'user'
                    CHECK (platform_role IN ('super_admin', 'support', 'user')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX user_profiles_email_unique ON user_profiles (lower(email)) WHERE status <> 'deleted';
CREATE INDEX user_profiles_auth_provider_idx ON user_profiles (auth_provider_id);

CREATE TABLE tenant_memberships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'agent'
                    CHECK (role IN ('owner', 'admin', 'agent', 'editor', 'viewer')),
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'invited', 'suspended', 'revoked')),
  invited_by        UUID REFERENCES user_profiles(id),
  invited_at        TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX tenant_memberships_user_idx ON tenant_memberships (user_id);
CREATE INDEX tenant_memberships_tenant_role_idx ON tenant_memberships (tenant_id, role);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE property_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'residential'
                    CHECK (category IN ('residential', 'commercial', 'land', 'other')),
  sort_order        INT NOT NULL DEFAULT 0
);

INSERT INTO property_types (slug, name, category, sort_order) VALUES
  ('house', 'House / Duplex', 'residential', 10),
  ('apartment', 'Apartment', 'residential', 20),
  ('flat', 'Flat', 'residential', 30),
  ('bungalow', 'Bungalow', 'residential', 40),
  ('land', 'Land', 'land', 50),
  ('commercial', 'Commercial', 'commercial', 60),
  ('office', 'Office Space', 'commercial', 70),
  ('shop', 'Shop / Retail', 'commercial', 80),
  ('warehouse', 'Warehouse', 'commercial', 90),
  ('short_let', 'Short Let', 'residential', 100);

CREATE TABLE properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  listing_type      TEXT NOT NULL DEFAULT 'sale'
                    CHECK (listing_type IN ('sale', 'rent', 'lease', 'short_let')),
  property_type_id  UUID REFERENCES property_types(id),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'under_offer', 'sold', 'rented', 'archived')),
  price             NUMERIC(18, 2) NOT NULL CHECK (price >= 0),
  currency          TEXT NOT NULL DEFAULT 'NGN',
  price_period      TEXT CHECK (price_period IN ('month', 'year', 'night', 'week', NULL)),
  bedrooms          INT CHECK (bedrooms IS NULL OR bedrooms >= 0),
  bathrooms         INT CHECK (bathrooms IS NULL OR bathrooms >= 0),
  toilets           INT CHECK (toilets IS NULL OR toilets >= 0),
  parking_spaces    INT CHECK (parking_spaces IS NULL OR parking_spaces >= 0),
  area_value        NUMERIC(12, 2),
  area_unit         TEXT DEFAULT 'sqm',
  address           TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT NOT NULL DEFAULT 'NG',
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  features          JSONB NOT NULL DEFAULT '[]',
  assigned_agent_id UUID REFERENCES user_profiles(id),
  created_by        UUID REFERENCES user_profiles(id),
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX properties_tenant_status_idx ON properties (tenant_id, status);
CREATE INDEX properties_tenant_listing_idx ON properties (tenant_id, listing_type);
CREATE INDEX properties_city_idx ON properties (city);
CREATE INDEX properties_price_idx ON properties (price);
CREATE INDEX properties_assigned_agent_idx ON properties (assigned_agent_id);

CREATE TABLE property_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  storage_key       TEXT NOT NULL,
  url               TEXT,
  media_type        TEXT NOT NULL DEFAULT 'image'
                    CHECK (media_type IN ('image', 'video', 'floor_plan', 'document')),
  alt_text          TEXT,
  sort_order        INT NOT NULL DEFAULT 0,
  is_cover          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX property_media_property_idx ON property_media (property_id);
CREATE INDEX property_media_tenant_idx ON property_media (tenant_id);

CREATE TABLE saved_properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

-- ============================================================
-- CRM & VIEWINGS
-- ============================================================

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  source            TEXT NOT NULL DEFAULT 'website'
                    CHECK (source IN ('website', 'enquiry', 'viewing_request', 'manual', 'referral', 'other')),
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'qualified', 'viewing_scheduled', 'negotiating', 'won', 'lost', 'spam')),
  assigned_agent_id UUID REFERENCES user_profiles(id),
  budget_min        NUMERIC(18, 2),
  budget_max        NUMERIC(18, 2),
  preferred_location TEXT,
  notes             TEXT,
  follow_up_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_tenant_status_idx ON leads (tenant_id, status);
CREATE INDEX leads_assigned_agent_idx ON leads (assigned_agent_id);
CREATE INDEX leads_follow_up_idx ON leads (follow_up_at) WHERE follow_up_at IS NOT NULL;

CREATE TABLE property_viewings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent_id          UUID REFERENCES user_profiles(id),
  visitor_name      TEXT NOT NULL,
  visitor_email     TEXT,
  visitor_phone     TEXT,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 60,
  status            TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  notes             TEXT,
  created_by        UUID REFERENCES user_profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX property_viewings_tenant_scheduled_idx ON property_viewings (tenant_id, scheduled_at);
CREATE INDEX property_viewings_agent_idx ON property_viewings (agent_id);
CREATE INDEX property_viewings_property_idx ON property_viewings (property_id);

-- ============================================================
-- WEBSITE PAGES & SUBSCRIPTIONS
-- ============================================================

CREATE TABLE tenant_pages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  title             TEXT NOT NULL,
  content           JSONB NOT NULL DEFAULT '{}',
  seo_title         TEXT,
  seo_description   TEXT,
  published         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_code         TEXT NOT NULL DEFAULT 'starter',
  status            TEXT NOT NULL DEFAULT 'trialing'
                    CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  provider          TEXT,
  provider_subscription_id TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_tenant_idx ON subscriptions (tenant_id);
CREATE INDEX subscriptions_status_idx ON subscriptions (status);

-- ============================================================
-- AUDIT
-- ============================================================

CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id          UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action            TEXT NOT NULL,
  entity_type       TEXT,
  entity_id         UUID,
  metadata          JSONB NOT NULL DEFAULT '{}',
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_tenant_idx ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id);

COMMIT;
