"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";
import { queryOne, query } from "@/lib/db";

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
