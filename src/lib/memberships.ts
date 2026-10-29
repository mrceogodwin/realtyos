import { query, queryMany, queryOne } from "./db";
import type { MembershipRole, MembershipStatus, TenantMembership } from "./types";

export async function listMemberships(
  tenantId: string
): Promise<TenantMembership[]> {
  return queryMany<TenantMembership>(
    `SELECT * FROM tenant_memberships
     WHERE tenant_id = $1
     ORDER BY
       CASE role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'agent' THEN 3
         WHEN 'editor' THEN 4
         ELSE 5
       END,
       created_at ASC`,
    [tenantId]
  );
}

export async function getMembership(
  tenantId: string,
  userId: string
): Promise<TenantMembership | null> {
  return queryOne<TenantMembership>(
    `SELECT * FROM tenant_memberships
     WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, userId]
  );
}

export async function inviteMember(
  tenantId: string,
  userId: string,
  role: MembershipRole,
  invitedBy: string
): Promise<TenantMembership> {
  const result = await query<TenantMembership>(
    `INSERT INTO tenant_memberships (
      tenant_id, user_id, role, status, invited_by, invited_at
    ) VALUES ($1, $2, $3, 'invited', $4, now())
    ON CONFLICT (tenant_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          status = 'invited',
          invited_by = EXCLUDED.invited_by,
          invited_at = now(),
          updated_at = now()
    RETURNING *`,
    [tenantId, userId, role, invitedBy]
  );
  return result.rows[0];
}

export async function updateMembershipRole(
  tenantId: string,
  membershipId: string,
  role: MembershipRole
): Promise<TenantMembership | null> {
  return queryOne<TenantMembership>(
    `UPDATE tenant_memberships
     SET role = $1, updated_at = now()
     WHERE id = $2 AND tenant_id = $3 AND role <> 'owner'
     RETURNING *`,
    [role, membershipId, tenantId]
  );
}

export async function updateMembershipStatus(
  tenantId: string,
  membershipId: string,
  status: MembershipStatus
): Promise<TenantMembership | null> {
  return queryOne<TenantMembership>(
    `UPDATE tenant_memberships
     SET status = $1, updated_at = now()
     WHERE id = $2 AND tenant_id = $3 AND role <> 'owner'
     RETURNING *`,
    [status, membershipId, tenantId]
  );
}
