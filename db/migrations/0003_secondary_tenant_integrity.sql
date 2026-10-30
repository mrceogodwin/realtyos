-- Additional tenant-scoped foreign keys for secondary records and assignments.
BEGIN;

ALTER TABLE leads
  ADD CONSTRAINT leads_assigned_agent_membership_fk
  FOREIGN KEY (tenant_id, assigned_agent_id)
  REFERENCES tenant_memberships (tenant_id, user_id);

ALTER TABLE properties
  ADD CONSTRAINT properties_creator_membership_fk
  FOREIGN KEY (tenant_id, created_by)
  REFERENCES tenant_memberships (tenant_id, user_id);

ALTER TABLE property_viewings
  ADD CONSTRAINT viewings_creator_membership_fk
  FOREIGN KEY (tenant_id, created_by)
  REFERENCES tenant_memberships (tenant_id, user_id);

ALTER TABLE property_media
  ADD CONSTRAINT property_media_same_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties (tenant_id, id);

ALTER TABLE saved_properties
  ADD CONSTRAINT saved_properties_same_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties (tenant_id, id);

COMMIT;
