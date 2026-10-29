/**
 * Authentication foundation for RealtyOS.
 *
 * Planned provider: Auth.js (NextAuth v5) with a Postgres adapter against Neon.
 * Until the full auth flow is wired and secrets are configured, these helpers
 * document the intended contract and keep the rest of the codebase typed.
 *
 * Required environment variables (see .env.example):
 *   AUTH_SECRET
 *   AUTH_URL / NEXT_PUBLIC_APP_URL
 *
 * Once live:
 * 1. User signs up / logs in via Auth.js
 * 2. We upsert into user_profiles using the provider subject id
 * 3. We resolve the active tenant membership for the session
 * 4. Every private route and server action receives an AuthContext
 * 5. Client-supplied tenant IDs are ignored
 */

import type { AuthContext, Tenant, TenantMembership, UserProfile } from "./types";

/**
 * Placeholder. Will be replaced by Auth.js session resolution.
 * Returns null until authentication is implemented.
 */
export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  // TODO: implement with Auth.js
  // const session = await auth();
  // if (!session?.user) return null;
  // load user_profiles + active membership + tenant
  return null;
}

export function requireAuth(context: AuthContext | null): AuthContext {
  if (!context) {
    throw new Error("Authentication required");
  }
  return context;
}

export function requireTenant(
  context: AuthContext | null
): AuthContext & { tenant: Tenant; membership: TenantMembership } {
  const auth = requireAuth(context);
  if (!auth.tenant || !auth.membership) {
    throw new Error("No active workspace. Complete onboarding first.");
  }
  if (auth.membership.status !== "active") {
    throw new Error("Your membership in this workspace is not active.");
  }
  return auth as AuthContext & { tenant: Tenant; membership: TenantMembership };
}

export function requireSuperAdmin(context: AuthContext | null): AuthContext {
  const auth = requireAuth(context);
  if (!auth.isSuperAdmin) {
    throw new Error("Platform administrator access required");
  }
  return auth;
}

/**
 * Build a typed AuthContext from already-loaded records.
 * Used after successful login / membership switch.
 */
export function buildAuthContext(
  user: UserProfile,
  membership: TenantMembership | null,
  tenant: Tenant | null
): AuthContext {
  return {
    user,
    membership,
    tenant,
    isSuperAdmin: user.platform_role === "super_admin",
  };
}
