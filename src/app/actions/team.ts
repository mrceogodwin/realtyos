"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";
import { queryOne, query, withTransaction } from "@/lib/db";

export type TeamActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

const invitationSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["admin", "agent", "editor", "viewer"]),
});

export async function createTeamInvitationAction(raw: unknown): Promise<TeamActionResult<{
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitationUrl: string;
}>> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Authentication required", code: "AUTH_REQUIRED" };

  let scope;
  try {
    scope = requireTenant(context);
  } catch {
    return { ok: false, error: "Choose an active workspace first", code: "NO_TENANT" };
  }

  if (!hasMinimumRole(scope.membership, "admin")) {
    return { ok: false, error: "Only workspace owners and admins can invite members", code: "FORBIDDEN" };
  }

  const parsed = invitationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; "), code: "VALIDATION" };
  }

  const email = parsed.data.email.toLowerCase();
  if (email === scope.user.email.toLowerCase()) {
    return { ok: false, error: "You are already a member of this workspace", code: "ALREADY_MEMBER" };
  }

  try {
    const existingMember = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM tenant_memberships
        WHERE tenant_id = $1
          AND user_id = (SELECT id FROM user_profiles WHERE lower(email) = $2 AND status = 'active')
        LIMIT 1`,
      [scope.tenant.id, email]
    );
    if (existingMember?.status === "active") {
      return { ok: false, error: "This person is already a workspace member", code: "ALREADY_MEMBER" };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const invitation = await queryOne<{ id: string; expires_at: string }>(
      `INSERT INTO tenant_invitations
         (tenant_id, email, role, token_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '7 days')
       RETURNING id, expires_at`,
      [scope.tenant.id, email, parsed.data.role, tokenHash, scope.user.id]
    );

    if (!invitation) return { ok: false, error: "Invitation could not be created", code: "SERVER" };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL;
    if (!baseUrl) {
      // Revoke the token record rather than leave an unusable invitation.
      await query("UPDATE tenant_invitations SET status = 'revoked', updated_at = now() WHERE id = $1", [invitation.id]);
      return { ok: false, error: "Set NEXT_PUBLIC_APP_URL to create shareable invitation links", code: "CONFIG" };
    }

    return {
      ok: true,
      data: {
        id: invitation.id,
        email,
        role: parsed.data.role,
        expiresAt: invitation.expires_at,
        invitationUrl: `${baseUrl.replace(/\/$/, "")}/invite/${rawToken}`,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("tenant_invitations_pending_email_unique") || message.includes("duplicate key")) {
      return { ok: false, error: "A pending invitation already exists for this email", code: "INVITE_EXISTS" };
    }
    console.error("[createTeamInvitationAction]", error);
    return { ok: false, error: "Unable to create invitation", code: "SERVER" };
  }
}

export async function acceptTeamInvitationAction(rawToken: string): Promise<TeamActionResult<{ tenantId: string }>> {
  const context = await getCurrentAuthContext();
  if (!context) return { ok: false, error: "Sign in before accepting this invitation", code: "AUTH_REQUIRED" };
  if (!context.user.email_verified) return { ok: false, error: "A verified email address is required", code: "EMAIL_UNVERIFIED" };
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) return { ok: false, error: "Invitation link is invalid", code: "INVALID_TOKEN" };

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  try {
    const tenantId = await withTransaction(async (client) => {
      const invitation = await client.query<{
        id: string; tenant_id: string; email: string; role: string; invited_by: string;
      }>(
        `SELECT id, tenant_id, email, role, invited_by
           FROM tenant_invitations
          WHERE token_hash = $1 AND status = 'pending' AND expires_at > now()
          FOR UPDATE`,
        [tokenHash]
      );
      const invite = invitation.rows[0];
      if (!invite) throw new Error("INVITATION_INVALID_OR_EXPIRED");
      if (invite.email.toLowerCase() !== context.user.email.toLowerCase()) {
        throw new Error("INVITATION_EMAIL_MISMATCH");
      }

      const tenant = await client.query(
        "SELECT id FROM tenants WHERE id = $1 AND status = 'active' AND deleted_at IS NULL",
        [invite.tenant_id]
      );
      if (!tenant.rowCount) throw new Error("WORKSPACE_UNAVAILABLE");

      const membership = await client.query(
        `INSERT INTO tenant_memberships (tenant_id, user_id, role, status, invited_by, invited_at, accepted_at)
         VALUES ($1, $2, $3, 'active', $4, now(), now())
         ON CONFLICT (tenant_id, user_id) DO UPDATE
           SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by,
               invited_at = EXCLUDED.invited_at, accepted_at = now(), updated_at = now()
         WHERE tenant_memberships.status IN ('invited', 'revoked')
         RETURNING id`,
        [invite.tenant_id, context.user.id, invite.role, invite.invited_by]
      );
      if (!membership.rowCount) {
        const existing = await client.query(
          "SELECT status FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2",
          [invite.tenant_id, context.user.id]
        );
        if (existing.rows[0]?.status !== "active") throw new Error("MEMBERSHIP_UNAVAILABLE");
      }

      await client.query(
        `UPDATE tenant_invitations
            SET status = 'accepted', accepted_by = $2, accepted_at = now(), updated_at = now()
          WHERE id = $1`,
        [invite.id, context.user.id]
      );
      return invite.tenant_id;
    });
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("realtyos_active_tenant", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true, data: { tenantId } };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "INVITATION_EMAIL_MISMATCH") return { ok: false, error: "This invitation was sent to a different email address. Sign in with the invited account.", code };
    if (code === "INVITATION_INVALID_OR_EXPIRED") return { ok: false, error: "This invitation is invalid, already used or has expired.", code };
    if (code === "WORKSPACE_UNAVAILABLE") return { ok: false, error: "This workspace is no longer available.", code };
    if (code === "MEMBERSHIP_UNAVAILABLE") return { ok: false, error: "Your existing membership is suspended. Contact a workspace owner.", code };
    console.error("[acceptTeamInvitationAction]", error);
    return { ok: false, error: "Unable to accept invitation", code: "SERVER" };
  }
}
