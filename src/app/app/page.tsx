"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function AppOverviewPage() {
  return (
    <AppShell
      title="Good morning, Godwin"
      subtitle="Demonstration workspace. Metrics and listings become live when Neon and auth are connected."
      actions={
        <Link href="/app/properties" className="primary-button">
          <Plus size={17} /> Add property
        </Link>
      }
    >
      <div className="metric-grid">
        <Metric
          title="Total properties"
          value="24"
          change="Demo"
          note="Replace with live count"
          icon={<Building2 size={18} />}
          trend="up"
        />
        <Metric
          title="Active leads"
          value="18"
          change="Demo"
          note="Replace with live count"
          icon={<Users size={18} />}
          trend="up"
        />
        <Metric
          title="Viewings booked"
          value="07"
          change="3 upcoming"
          note="Demo schedule"
          icon={<CalendarDays size={18} />}
          trend="neutral"
        />
        <Metric
          title="Portfolio value"
          value="₦2.84B"
          change="Demo"
          note="Published asking total"
          icon={<TrendingUp size={18} />}
          trend="up"
        />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Quick links</h2>
              <p>Jump into the core workspaces.</p>
            </div>
          </div>
          <div className="quick-links">
            <Link href="/app/properties" className="quick-link">
              <Building2 size={18} />
              <div>
                <strong>Properties</strong>
                <span>Inventory, status and new listings</span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/app/leads" className="quick-link">
              <Users size={18} />
              <div>
                <strong>Leads & clients</strong>
                <span>Pipeline stages and follow-ups</span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/app/viewings" className="quick-link">
              <CalendarDays size={18} />
              <div>
                <strong>Viewings</strong>
                <span>Schedule and appointment status</span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Upcoming viewings</h2>
              <p>Next appointments in the demo schedule.</p>
            </div>
            <Link href="/app/viewings" className="text-button">
              Open calendar <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="viewing-date">
            <div className="date-tile">
              <span>OCT</span>
              <strong>30</strong>
            </div>
            <div className="viewing-copy">
              <strong>Meridian Residence</strong>
              <span>
                <Clock3 size={13} /> Tomorrow, 10:30 AM
              </span>
              <span>
                <MapPin size={13} /> Lekki Phase 1, Lagos
              </span>
            </div>
          </div>
          <div className="viewing-date">
            <div className="date-tile">
              <span>OCT</span>
              <strong>31</strong>
            </div>
            <div className="viewing-copy">
              <strong>Palm Court Apartments</strong>
              <span>
                <Clock3 size={13} /> Saturday, 12:00 PM
              </span>
              <span>
                <MapPin size={13} /> Victoria Island, Lagos
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  title,
  value,
  change,
  icon,
  trend,
  note,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "neutral";
  note: string;
}) {
  return (
    <section className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span className={"metric-change " + (trend === "up" ? "positive" : "")}>
          {change}
        </span>
        <span className="metric-note">{note}</span>
      </div>
    </section>
  );
}
