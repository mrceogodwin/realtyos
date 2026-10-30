import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, Plus, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentAuthContext } from "@/lib/auth";
import { queryOne } from "@/lib/db";

type Counts = { properties: string; leads: string; viewings: string; portfolio: string };

export default async function AppOverviewPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  if (!context.tenant || !context.membership) redirect("/onboarding");

  const counts = await queryOne<Counts>(
    `SELECT
      (SELECT count(*)::text FROM properties WHERE tenant_id = $1 AND status <> 'archived') AS properties,
      (SELECT count(*)::text FROM leads WHERE tenant_id = $1 AND status NOT IN ('won','lost','spam')) AS leads,
      (SELECT count(*)::text FROM property_viewings WHERE tenant_id = $1 AND status IN ('requested','confirmed','rescheduled') AND scheduled_at >= now()) AS viewings,
      (SELECT COALESCE(sum(price),0)::text FROM properties WHERE tenant_id = $1 AND status = 'published' AND listing_type = 'sale') AS portfolio`,
    [context.tenant.id]
  );

  return (
    <AppShell title="Overview" subtitle={`Live workspace overview for ${context.tenant.name}.`} actions={<Link href="/app/properties" className="primary-button"><Plus size={17} /> Add property</Link>}>
      <div className="metric-grid">
        <Metric title="Total properties" value={counts?.properties ?? "0"} note="Not archived" icon={<Building2 size={18} />} />
        <Metric title="Active leads" value={counts?.leads ?? "0"} note="Open pipeline" icon={<Users size={18} />} />
        <Metric title="Upcoming viewings" value={counts?.viewings ?? "0"} note="Future appointments" icon={<CalendarDays size={18} />} />
        <Metric title="Published sale portfolio" value={new Intl.NumberFormat("en-NG", { style: "currency", currency: context.tenant.currency || "NGN", maximumFractionDigits: 0 }).format(Number(counts?.portfolio ?? 0))} note="Published sale listings" icon={<TrendingUp size={18} />} />
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>Quick links</h2><p>Jump into the core workspaces.</p></div></div>
          <div className="quick-links">
            <QuickLink href="/app/properties" icon={<Building2 size={18} />} title="Properties" description="Inventory, status and new listings" />
            <QuickLink href="/app/leads" icon={<Users size={18} />} title="Leads & clients" description="Pipeline stages and follow-ups" />
            <QuickLink href="/app/viewings" icon={<CalendarDays size={18} />} title="Viewings" description="Schedule and appointments" />
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Workspace data</h2><p>Counts are scoped to your active workspace.</p></div><ArrowUpRight size={16} /></div>
          <p className="empty-state">Your live metrics are connected. Open Properties, Leads or Viewings to manage records.</p>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ title, value, note, icon }: { title: string; value: string; note: string; icon: React.ReactNode }) {
  return <section className="metric-card"><div className="metric-top"><span>{title}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className="metric-note">{note}</span></div></section>;
}

function QuickLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return <Link href={href} className="quick-link">{icon}<div><strong>{title}</strong><span>{description}</span></div><ArrowUpRight size={16} /></Link>;
}
