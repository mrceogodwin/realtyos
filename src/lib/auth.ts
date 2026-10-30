import { auth } from "@/auth";
import { cookies } from "next/headers";
import { queryOne } from "./db";
import type { AuthContext, Tenant, TenantMembership, UserProfile } from "./types";

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await queryOne<UserProfile>(
    `SELECT id, auth_provider_id, email, email_verified, full_name, avatar_url,
            phone, status, platform_role, created_at, updated_at, last_login_at
       FROM user_profiles
      WHERE id = $1 AND status = 'active'
      LIMIT 1`,
    [userId]
  );
  if (!user) return null;

  const cookieStore = await cookies();
  const requestedTenantId = cookieStore.get("realtyos_active_tenant")?.value;

  const membership = await queryOne<TenantMembership>(
    `SELECT m.id, m.tenant_id, m.user_id, m.role, m.status, m.invited_by,
            m.invited_at, m.accepted_at, m.created_at, m.updated_at
       FROM tenant_memberships m
       JOIN tenants t ON t.id = m.tenant_id
      WHERE m.user_id = $1
        AND ($2::uuid IS NULL OR m.tenant_id = $2::uuid)
        AND m.status = 'active'
        AND t.status = 'active'
        AND t.deleted_at IS NULL
      ORDER BY
        CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2
          WHEN 'agent' THEN 3 WHEN 'editor' THEN 4 ELSE 5 END,
        m.accepted_at DESC NULLS LAST, m.created_at ASC
      LIMIT 1`,
    [user.id, requestedTenantId ?? null]
  );

  const tenant = membership
    ? await queryOne<Tenant>(
        `SELECT id, name, slug, status, country, currency, timezone, plan_id,
                created_at, updated_at, deleted_at
           FROM tenants
          WHERE id = $1 AND status = 'active' AND deleted_at IS NULL
          LIMIT 1`,
        [membership.tenant_id]
      )
    : null;

  return {
    user,
    membership: tenant ? membership : null,
    tenant,
    isSuperAdmin: user.platform_role === "super_admin",
  };
}

export function requireAuth(context: AuthContext | null): AuthContext {
  if (!context) throw new Error("Authentication required");
  return context;
}

export function requireTenant(
  context: AuthContext | null
): AuthContext & { tenant: Tenant; membership: TenantMembership } {
  const current = requireAuth(context);
  if (!current.tenant || !current.membership) {
    throw new Error("No active workspace. Complete onboarding first.");
  }
  if (current.membership.status !== "active") {
    throw new Error("Your membership in this workspace is not active.");
  }
  return current as AuthContext & { tenant: Tenant; membership: TenantMembership };
}

export function requireSuperAdmin(context: AuthContext | null): AuthContext {
  const current = requireAuth(context);
  if (!current.isSuperAdmin) throw new Error("Platform administrator access required");
  return current;
}

export function buildAuthContext(
  user: UserProfile,
  membership: TenantMembership | null,
  tenant: Tenant | null
): AuthContext {
  return { user, membership, tenant, isSuperAdmin: user.platform_role === "super_admin" };
}
