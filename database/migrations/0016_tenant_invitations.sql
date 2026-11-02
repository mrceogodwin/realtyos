-- RealtyOS: secure, single-use workspace invitations.
-- Apply only after reviewing this migration against the target Neon branch.
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'agent', 'editor', 'viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES user_profiles(id),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by uuid REFERENCES user_profiles(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_invitations_email_normalized CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_invitations_pending_email_unique
  ON tenant_invitations (tenant_id, email)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS tenant_invitations_tenant_status_expiry_idx
  ON tenant_invitations (tenant_id, status, expires_at);

CREATE INDEX IF NOT EXISTS tenant_invitations_expiry_idx
  ON tenant_invitations (expires_at)
  WHERE status = 'pending';
