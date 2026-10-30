import { AppShell } from "@/components/app-shell";
import { ViewingsWorkspace } from "@/components/viewings-workspace";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { listProperties } from "@/lib/properties";
import { listLeads } from "@/lib/leads";
import { listViewings } from "@/lib/viewings";
import type { Property, Lead, PropertyViewing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ViewingsPage() {
  const context = await getCurrentAuthContext();
  if (!context?.tenant) return null;
  let viewings: PropertyViewing[] = [];
  let properties: Property[] = [];
  let leads: Lead[] = [];
  let databaseUnavailable = false;
  try {
    const tenantId = context.tenant.id;
    [viewings, properties, leads] = await Promise.all([
      listViewings({ tenantId, limit: 100 }),
      listProperties({ tenantId, limit: 100 }),
      listLeads({ tenantId, limit: 100 }),
    ]);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell title="Viewings" subtitle={`Viewing appointments for ${context.tenant.name}.`}>
      {databaseUnavailable
        ? <section className="panel"><div className="empty-state"><strong>Database connection required</strong><span>Viewing appointments will appear here when the workspace database is configured.</span></div></section>
        : <ViewingsWorkspace initialViewings={viewings} properties={properties} leads={leads} />}
    </AppShell>
  );
}
