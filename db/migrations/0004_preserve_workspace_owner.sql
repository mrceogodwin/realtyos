-- Prevent a workspace from losing its final active owner.
BEGIN;

CREATE OR REPLACE FUNCTION prevent_last_active_workspace_owner_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  remaining_owners INTEGER;
  target_tenant UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_tenant := OLD.tenant_id;
  ELSE
    target_tenant := OLD.tenant_id;
  END IF;

  IF OLD.role = 'owner' AND OLD.status = 'active'
     AND (TG_OP = 'DELETE'
       OR NEW.role <> 'owner'
       OR NEW.status <> 'active'
       OR NEW.tenant_id <> OLD.tenant_id) THEN
    -- Allow tenant deletion cascades; the tenant itself is being removed.
    IF EXISTS (SELECT 1 FROM tenants WHERE id = target_tenant) THEN
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

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenant_memberships_preserve_owner
BEFORE UPDATE OF tenant_id, role, status OR DELETE
ON tenant_memberships
FOR EACH ROW
EXECUTE FUNCTION prevent_last_active_workspace_owner_removal();

COMMIT;
