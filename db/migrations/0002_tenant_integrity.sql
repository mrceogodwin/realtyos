-- RealtyOS tenant-integrity hardening
-- Prevent cross-workspace references even if a future caller bypasses service checks.
-- Existing rows are validated when the migration runs; the migration fails rather than
-- silently accepting inconsistent historical records.

BEGIN;

ALTER TABLE properties
  ADD CONSTRAINT properties_tenant_id_id_unique UNIQUE (tenant_id, id);

ALTER TABLE leads
  ADD CONSTRAINT leads_tenant_id_id_unique UNIQUE (tenant_id, id);

ALTER TABLE properties
  ADD CONSTRAINT properties_assigned_agent_membership_fk
  FOREIGN KEY (tenant_id, assigned_agent_id)
  REFERENCES tenant_memberships (tenant_id, user_id);

ALTER TABLE leads
  ADD CONSTRAINT leads_property_same_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties (tenant_id, id);

ALTER TABLE leads
  ADD CONSTRAINT leads_assigned_agent_membership_fk
  FOREIGN KEY (tenant_id, assigned_agent_id)
  REFERENCES tenant_memberships (tenant_id, user_id);

ALTER TABLE property_viewings
  ADD CONSTRAINT viewings_property_same_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties (tenant_id, id);

ALTER TABLE property_viewings
  ADD CONSTRAINT viewings_lead_same_tenant_fk
  FOREIGN KEY (tenant_id, lead_id)
  REFERENCES leads (tenant_id, id);

ALTER TABLE property_viewings
  ADD CONSTRAINT viewings_agent_membership_fk
  FOREIGN KEY (tenant_id, agent_id)
  REFERENCES tenant_memberships (tenant_id, user_id);

COMMIT;
