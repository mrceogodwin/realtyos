import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError, queryMany } from "@/lib/db";
import { TeamInviteForm } from "@/components/team-invite-form";

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: "owner" | "admin" | "agent" | "editor" | "viewer";
  status: "active" | "invited" | "suspended" | "revoked";
};

export default async function TeamPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  if (!context.tenant || !context.membership) redirect("/onboarding");

  const canManage = ["owner", "admin"].includes(context.membership.role);
  let members: TeamMember[] = [];
  let databaseUnavailable = false;
  try {
    members = await queryMany<TeamMember>(
      `SELECT m.id, u.full_name, u.email, m.role, m.status
         FROM tenant_memberships m
         JOIN user_profiles u ON u.id = m.user_id
        WHERE m.tenant_id = $1
        ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'agent' THEN 3 WHEN 'editor' THEN 4 ELSE 5 END,
                 CASE m.status WHEN 'active' THEN 1 WHEN 'invited' THEN 2 ELSE 3 END,
                 u.full_name NULLS LAST, u.email`,
      [context.tenant.id]
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell title="Team members" subtitle={`People and access in ${context.tenant.name}.`}>
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Workspace team</h2><p>Memberships and access roles from the database.</p></div>
          <span className="lead-source">{members.length} members</span>
        </div>
        {databaseUnavailable ? (
          <p className="empty-state">Connect DATABASE_URL and apply migrations to load workspace memberships.</p>
        ) : members.length === 0 ? (
          <p className="empty-state">No workspace memberships were found.</p>
        ) : (
          <div className="team-list">
            {members.map((member) => {
              const displayName = member.full_name || member.email;
              const initials = displayName.split(/\\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
              return (
                <article key={member.id} className="team-row">
                  <div className="lead-avatar">{initials || "U"}</div>
                  <div className="lead-main">
                    <div className="lead-title-line">
                      <h3>{displayName}</h3>
                      <span className={"lead-status status-" + member.status}>{member.status}</span>
                    </div>
                    <div className="lead-meta"><span>{member.email}</span><span>·</span><span className="lead-source">{member.role}</span></div>
                  </div>
                  {member.role === "owner" && <ShieldCheck size={18} aria-label="Workspace owner" />}
                </article>
              );
            })}
          </div>
        )}
      </section>
      {!canManage && <p className="empty-state"><Users size={16} /> You have view access to the team. Workspace admins manage invitations and roles.</p>}
      {canManage && (
        <section className="panel">
          <div className="panel-heading"><div><h2>Invitations</h2><p>Secure invitation creation and email delivery are not enabled yet.</p></div></div>
          <p className="empty-state">Create a single-use invitation link for a specific email address. Links expire after seven days and require the invited person to sign in with that verified email.</p><TeamInviteForm />
        </section>
      )}
    </AppShell>
  );
}
