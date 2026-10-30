-- Workspace invitations use hashed, single-use tokens with explicit expiry.
BEGIN;

CREATE TABLE tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'editor', 'viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES user_profiles(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tenant_invitations_tenant_status_idx
  ON tenant_invitations (tenant_id, status, created_at DESC);

CREATE UNIQUE INDEX tenant_invitations_pending_email_unique
  ON tenant_invitations (tenant_id, lower(email))
  WHERE status = 'pending';

COMMIT;
