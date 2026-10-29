/**
 * Tenant resolution and authorization helpers.
 * These are server-only utilities. Never trust a client-supplied tenant ID.
 */

import type { MembershipRole, TenantMembership } from "./types";

const ROLE_RANK: Record<MembershipRole, number> = {
  viewer: 10,
  editor: 20,
  agent: 30,
  admin: 40,
  owner: 50,
};

export function hasMinimumRole(
  membership: TenantMembership | null | undefined,
  required: MembershipRole
): boolean {
  if (!membership || membership.status !== "active") return false;
  return ROLE_RANK[membership.role] >= ROLE_RANK[required];
}

export function canManageProperties(membership: TenantMembership | null): boolean {
  return hasMinimumRole(membership, "editor");
}

export function canManageLeads(membership: TenantMembership | null): boolean {
  return hasMinimumRole(membership, "agent");
}

export function canManageTeam(membership: TenantMembership | null): boolean {
  return hasMinimumRole(membership, "admin");
}

export function canManageBilling(membership: TenantMembership | null): boolean {
  return hasMinimumRole(membership, "owner");
}

export function canManageBranding(membership: TenantMembership | null): boolean {
  return hasMinimumRole(membership, "admin");
}

/**
 * Assert that a record belongs to the given tenant.
 * Throws if the tenant IDs do not match.
 */
export function assertTenantOwnership(
  recordTenantId: string,
  currentTenantId: string,
  message = "Access denied: resource does not belong to this workspace"
): void {
  if (recordTenantId !== currentTenantId) {
    throw new Error(message);
  }
}
