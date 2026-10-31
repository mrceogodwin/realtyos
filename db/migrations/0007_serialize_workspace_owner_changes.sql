-- Serialize owner changes on the tenant row before counting active owners.
BEGIN;

CREATE OR REPLACE FUNCTION prevent_last_active_workspace_owner_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  remaining_owners INTEGER;
  target_tenant UUID;
BEGIN
  target_tenant := OLD.tenant_id;

  IF OLD.role = 'owner' AND OLD.status = 'active'
     AND (TG_OP = 'DELETE'
       OR NEW.role <> 'owner'
       OR NEW.status <> 'active'
       OR NEW.tenant_id <> OLD.tenant_id) THEN
    -- Tenant-row lock serializes concurrent demotions/removals in this workspace.
    PERFORM id FROM tenants WHERE id = target_tenant FOR UPDATE;

    IF FOUND THEN
      SELECT count(*) INTO remaining_owners
        FROM tenant_memberships
       WHERE tenant_id = target_tenant
         AND role = 'owner'
         AND status = 'active'
         AND id <> OLD.id;

      IF remaining_owners = 0 THEN
        RAISE EXCEPTION 'A workspace must retain at least one active owner'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

COMMIT;
