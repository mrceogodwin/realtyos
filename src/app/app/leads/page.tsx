import { AppShell } from "@/components/app-shell";
import { LeadsWorkspace } from "@/components/leads-workspace";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { listLeads } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const context = await getCurrentAuthContext();
  if (!context?.tenant) return null;
  let leads: Lead[] = [];
  let databaseUnavailable = false;
  try {
    leads = await listLeads({ tenantId: context.tenant.id, limit: 100 });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell title="Leads & clients" subtitle={`Live CRM pipeline for ${context.tenant.name}.`}>
      {databaseUnavailable
        ? <section className="panel"><div className="empty-state"><strong>Database connection required</strong><span>CRM records will appear here when the workspace database is configured.</span></div></section>
        : <LeadsWorkspace initialLeads={leads} />}
    </AppShell>
  );
}
