import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getCurrentAuthContext } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { AcceptInviteForm } from "@/components/accept-invite-form";

type Invitation = { email: string; role: string; workspace_name: string; expires_at: string };

export default async function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return <InviteMessage title="Invalid invitation" message="This invitation link is not valid." />;
  }

  const context = await getCurrentAuthContext();
  if (!context) redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await queryOne<Invitation>(
    `SELECT i.email, i.role, t.name AS workspace_name, i.expires_at
       FROM tenant_invitations i
       JOIN tenants t ON t.id = i.tenant_id
      WHERE i.token_hash = $1 AND i.status = 'pending'
        AND i.expires_at > now() AND t.status = 'active' AND t.deleted_at IS NULL
      LIMIT 1`,
    [tokenHash]
  );

  if (!invitation) {
    return <InviteMessage title="Invitation unavailable" message="This invitation has expired, has already been used, or is no longer valid." />;
  }

  const emailMatches = context.user.email_verified && context.user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Building2 size={22} /></div>
          <div><div className="brand-name">realty<span>OS</span></div><div className="brand-caption">REAL ESTATE, UNDER CONTROL</div></div>
        </div>
        <div className="modal-eyebrow">WORKSPACE INVITATION</div>
        <h1>Join {invitation.workspace_name}</h1>
        <p className="auth-subtitle">You have been invited as a <strong>{invitation.role}</strong> using <strong>{invitation.email}</strong>.</p>
        {!emailMatches ? (
          <p className="form-error">You are signed in as {context.user.email}. Sign in with the invited verified email address to accept this invitation.</p>
        ) : (
          <AcceptInviteForm token={token} />
        )}
        <p className="auth-footer"><ShieldCheck size={14} /> Invitation expires {new Date(invitation.expires_at).toLocaleString()}.</p>
        <p className="auth-footer"><Link href="/app">Return to RealtyOS</Link></p>
      </section>
    </main>
  );
}

function InviteMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="auth-shell"><section className="auth-card">
      <div className="auth-brand"><div className="brand-mark"><Building2 size={22} /></div><div className="brand-name">realty<span>OS</span></div></div>
      <h1>{title}</h1><p className="auth-subtitle">{message}</p><Link href="/app">Return to RealtyOS</Link>
    </section></main>
  );
}
