import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentAuthContext } from "@/lib/auth";
import { queryMany } from "@/lib/db";
import { WorkspacePicker } from "@/components/workspace-picker";

type WorkspaceOption = { tenant_id: string; name: string; slug: string; role: string };

export default async function WorkspacesPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  const workspaces = await queryMany<WorkspaceOption>(
    `SELECT t.id AS tenant_id, t.name, t.slug, m.role
       FROM tenant_memberships m
       JOIN tenants t ON t.id = m.tenant_id
      WHERE m.user_id = $1 AND m.status = 'active'
        AND t.status = 'active' AND t.deleted_at IS NULL
      ORDER BY t.name ASC`,
    [context.user.id]
  );
  return (
    <AppShell title="Your workspaces" subtitle="Switch between organisations where you have active membership.">
      <section className="panel">
        <div className="panel-heading"><div><h2>Available workspaces</h2><p>Only active memberships linked to your account are listed.</p></div></div>
        <WorkspacePicker workspaces={workspaces} activeTenantId={context.tenant?.id ?? null} />
      </section>
    </AppShell>
  );
}
