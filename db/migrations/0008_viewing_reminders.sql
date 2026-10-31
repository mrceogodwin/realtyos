BEGIN;

-- Required target key for the composite tenant-scoped reminder foreign key.
ALTER TABLE property_viewings
  ADD CONSTRAINT property_viewings_tenant_id_id_unique UNIQUE (tenant_id, id);

CREATE TABLE IF NOT EXISTS viewing_reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  viewing_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT viewing_reminder_same_tenant_fk
    FOREIGN KEY (viewing_id, tenant_id)
    REFERENCES property_viewings(id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT viewing_reminder_unique_recipient
    UNIQUE (viewing_id, recipient_email, reminder_type, scheduled_for)
);

CREATE INDEX IF NOT EXISTS viewing_reminder_due_idx
  ON viewing_reminder_deliveries (next_attempt_at, scheduled_for)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS viewing_reminder_tenant_idx
  ON viewing_reminder_deliveries (tenant_id, viewing_id);

COMMIT;
