import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, FileText, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentAuthContext } from "@/lib/auth";
import { DatabaseNotConfiguredError, queryMany, queryOne } from "@/lib/db";

type ReportMetrics = { listings: string; leads: string; viewings: string; portfolio: string };
type PipelineRow = { stage: string; count: string };

const stageLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  viewing_scheduled: "Viewing scheduled",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  if (!context.tenant || !context.membership) redirect("/onboarding");

  let metrics: ReportMetrics | null = null;
  let pipeline: PipelineRow[] = [];
  let databaseUnavailable = false;
  try {
    const tenantId = context.tenant.id;
    [metrics, pipeline] = await Promise.all([
      queryOne<ReportMetrics>(
        `SELECT
          (SELECT count(*)::text FROM properties WHERE tenant_id = $1 AND status = 'published') AS listings,
          (SELECT count(*)::text FROM leads WHERE tenant_id = $1 AND status NOT IN ('won','lost','spam')) AS leads,
          (SELECT count(*)::text FROM property_viewings WHERE tenant_id = $1 AND scheduled_at >= now() - interval '30 days' AND scheduled_at < now() + interval '30 days' AND status IN ('requested','confirmed','rescheduled','completed')) AS viewings,
          (SELECT COALESCE(sum(price),0)::text FROM properties WHERE tenant_id = $1 AND status = 'published' AND listing_type = 'sale') AS portfolio`,
        [tenantId]
      ),
      queryMany<PipelineRow>(
        `SELECT status AS stage, count(*)::text AS count
           FROM leads
          WHERE tenant_id = $1
          GROUP BY status
          ORDER BY CASE status
            WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'qualified' THEN 3
            WHEN 'viewing_scheduled' THEN 4 WHEN 'negotiating' THEN 5
            WHEN 'won' THEN 6 WHEN 'lost' THEN 7 ELSE 8 END`,
        [tenantId]
      ),
    ]);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  const maxCount = Math.max(1, ...pipeline.map((row) => Number(row.count)));
  const currency = context.tenant.currency || "NGN";
  const portfolio = metrics
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(metrics.portfolio || 0))
    : "—";

  return (
    <AppShell title="Reports & analytics" subtitle={`Live business performance for ${context.tenant.name}.`}>
      {databaseUnavailable ? (
        <section className="panel"><p className="empty-state">Connect the workspace database to load live reports. No sample figures are shown.</p></section>
      ) : (
        <>
          <div className="metric-grid">
            <Metric title="Published listings" value={metrics?.listings ?? "0"} note="Live published inventory" icon={<Building2 size={18} />} />
            <Metric title="Open leads" value={metrics?.leads ?? "0"} note="Excludes won, lost and spam" icon={<Users size={18} />} />
            <Metric title="Viewings (60-day window)" value={metrics?.viewings ?? "0"} note="Past 30 days and next 30 days" icon={<CalendarDays size={18} />} />
            <Metric title="Asking portfolio" value={portfolio} note={`${currency} · Published sale listings`} icon={<TrendingUp size={18} />} />
          </div>
          <div className="content-grid">
            <section className="panel">
              <div className="panel-heading"><div><h2>Lead pipeline</h2><p>Distribution by current CRM stage.</p></div><Link href="/app/leads" className="text-button">Open CRM <ArrowUpRight size={15} /></Link></div>
              {pipeline.length ? <div className="pipeline-list">{pipeline.map((row) => {
                const count = Number(row.count);
                const width = Math.max((count / maxCount) * 100, 3);
                return <div key={row.stage} className="pipeline-row"><div className="pipeline-label"><span className="pipe-dot" />{stageLabels[row.stage] || row.stage}</div><div className="pipeline-bar-track"><div className="pipeline-bar-fill" style={{ width: width + "%" }} /></div><strong>{count}</strong></div>;
              })}</div> : <p className="empty-state">No leads have entered this workspace yet.</p>}
            </section>
            <section className="panel">
              <div className="panel-heading"><div><h2>Business insights</h2><p>Live operational areas.</p></div><FileText size={18} className="muted-icon" /></div>
              <ul className="report-checklist"><li>Published property inventory</li><li>Lead conversion stages and pipeline</li><li>Viewing activity in a rolling 60-day window</li><li>Published sale portfolio asking value</li></ul>
              <p className="field-hint" style={{ padding: "0 18px 18px" }}>Figures are scoped to this company workspace. Revenue and agent performance reporting will be added when transaction and attribution records are available.</p>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Metric({ title, value, note, icon }: { title: string; value: string; note: string; icon: React.ReactNode }) {
  return <section className="metric-card"><div className="metric-top"><span>{title}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className="metric-note">{note}</span></div></section>;
}
