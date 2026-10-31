import { AppShell } from "@/components/app-shell";
import { ViewingsWorkspace } from "@/components/viewings-workspace";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { listProperties } from "@/lib/properties";
import { listLeads } from "@/lib/leads";
import { listViewings, listViewingActivities, type ViewingActivity } from "@/lib/viewings";
import { queryMany } from "@/lib/db";
import type { Property, Lead, PropertyViewing } from "@/lib/types";

export const dynamic = "force-dynamic";

type AgentOption = { user_id: string; full_name: string | null; email: string };

export default async function ViewingsPage() {
  const context = await getCurrentAuthContext();
  if (!context?.tenant) return null;
  let viewings: PropertyViewing[] = [];
  let properties: Property[] = [];
  let leads: Lead[] = [];
  let activities: ViewingActivity[] = [];
  let agents: AgentOption[] = [];
  let databaseUnavailable = false;
  try {
    const tenantId = context.tenant.id;
    [viewings, properties, leads, activities, agents] = await Promise.all([
      listViewings({ tenantId, limit: 100 }),
      listProperties({ tenantId, limit: 100 }),
      listLeads({ tenantId, limit: 100 }),
      listViewingActivities(tenantId, 200),
      queryMany<AgentOption>("SELECT m.user_id, u.full_name, u.email FROM tenant_memberships m JOIN user_profiles u ON u.id = m.user_id WHERE m.tenant_id = $1 AND m.status = $2 AND m.role = ANY($3::text[]) ORDER BY u.full_name NULLS LAST, u.email", [tenantId, "active", ["agent", "admin", "owner"]]),
    ]);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell title="Viewings" subtitle={`Viewing appointments for ${context.tenant.name}.`}>
      {databaseUnavailable
        ? <section className="panel"><div className="empty-state"><strong>Database connection required</strong><span>Viewing appointments will appear here when the workspace database is configured.</span></div></section>
        : <ViewingsWorkspace initialViewings={viewings} properties={properties} leads={leads} activities={activities} agents={agents} />}
    </AppShell>
  );
}
