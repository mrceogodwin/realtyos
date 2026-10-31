import { AppShell } from "@/components/app-shell";
import { LeadsWorkspace } from "@/components/leads-workspace";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { listLeads, listLeadActivities, type LeadActivity } from "@/lib/leads";
import { queryMany } from "@/lib/db";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

type AgentOption = { user_id: string; full_name: string | null; email: string };

export default async function LeadsPage() {
  const context = await getCurrentAuthContext();
  if (!context?.tenant) return null;
  let leads: Lead[] = [];
  let databaseUnavailable = false;
  let agents: AgentOption[] = [];
  let activities: LeadActivity[] = [];
  try {
    leads = await listLeads({ tenantId: context.tenant.id, limit: 100 });
    activities = await listLeadActivities(context.tenant.id, 200);
    agents = await queryMany<AgentOption>("SELECT m.user_id, u.full_name, u.email FROM tenant_memberships m JOIN user_profiles u ON u.id = m.user_id WHERE m.tenant_id = $1 AND m.status = $2 AND m.role IN ('agent', 'admin', 'owner') ORDER BY u.full_name NULLS LAST, u.email", [context.tenant.id, "active"]);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell title="Leads & clients" subtitle={`Live CRM pipeline for ${context.tenant.name}.`}>
      {databaseUnavailable
        ? <section className="panel"><div className="empty-state"><strong>Database connection required</strong><span>CRM records will appear here when the workspace database is configured.</span></div></section>
        : <LeadsWorkspace initialLeads={leads} agents={agents} activities={activities} />}
    </AppShell>
  );
}
