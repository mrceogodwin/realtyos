"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const pipeline = [
  { stage: "New", count: 4, tone: "new" },
  { stage: "Contacted", count: 3, tone: "contacted" },
  { stage: "Qualified", count: 2, tone: "qualified" },
  { stage: "Viewing scheduled", count: 2, tone: "viewing" },
  { stage: "Negotiating", count: 1, tone: "negotiating" },
  { stage: "Won", count: 0, tone: "won" },
];

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Business snapshot for this workspace. Figures are demo until metrics are queried from Neon."
    >
      <div className="metric-grid">
        <Metric
          title="Published listings"
          value="—"
          note="Live after DB"
          icon={<Building2 size={18} />}
        />
        <Metric
          title="Open leads"
          value="—"
          note="Live after DB"
          icon={<Users size={18} />}
        />
        <Metric
          title="Viewings (30d)"
          value="—"
          note="Live after DB"
          icon={<CalendarDays size={18} />}
        />
        <Metric
          title="Asking portfolio"
          value="—"
          note="NGN total"
          icon={<TrendingUp size={18} />}
        />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Lead pipeline</h2>
              <p>Stage distribution (demo counts for layout only).</p>
            </div>
            <Link href="/app/leads" className="text-button">
              Open CRM <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="pipeline-list">
            {pipeline.map((row) => (
              <div key={row.stage} className="pipeline-row">
                <div className="pipeline-label">
                  <span className={"pipe-dot pipe-" + row.tone} />
                  {row.stage}
                </div>
                <div className="pipeline-bar-track">
                  <div
                    className={"pipeline-bar-fill pipe-fill-" + row.tone}
                    style={{ width: Math.max(row.count * 12, 4) + "%" }}
                  />
                </div>
                <strong>{row.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>What reports will include</h2>
              <p>Aligned with the PRD — only when data exists.</p>
            </div>
            <FileText size={18} className="muted-icon" />
          </div>
          <ul className="report-checklist">
            <li>Listings by status and city</li>
            <li>Lead conversion by source</li>
            <li>Viewing show-up rate</li>
            <li>Agent activity (assignments closed)</li>
            <li>Portfolio value of published asking prices</li>
          </ul>
          <p className="field-hint" style={{ padding: "0 18px 18px" }}>
            Empty states replace invented charts. Export and date ranges ship after
            live metrics are stable.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span className="metric-note">{note}</span>
      </div>
    </section>
  );
}
