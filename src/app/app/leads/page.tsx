"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Viewing scheduled"
  | "Negotiating"
  | "Won"
  | "Lost";

type Lead = {
  id: string;
  name: string;
  contact: string;
  property: string;
  source: string;
  status: LeadStatus;
  budget: string;
  updated: string;
};

const demoLeads: Lead[] = [
  {
    id: "1",
    name: "Amaka Kingsley",
    contact: "amaka@email.com · 0803…",
    property: "The Meridian Residence",
    source: "Website",
    status: "New",
    budget: "₦250–300M",
    updated: "12 min ago",
  },
  {
    id: "2",
    name: "Tunde Okonkwo",
    contact: "tunde@email.com · 0812…",
    property: "Palm Court Apartments",
    source: "Enquiry",
    status: "Contacted",
    budget: "₦80–100M",
    updated: "48 min ago",
  },
  {
    id: "3",
    name: "Efe Oghene",
    contact: "efe@email.com · 0701…",
    property: "The Meridian Residence",
    source: "Viewing request",
    status: "Viewing scheduled",
    budget: "₦280M",
    updated: "Yesterday",
  },
  {
    id: "4",
    name: "Ngozi Adeyemi",
    contact: "ngozi@email.com · 0902…",
    property: "Harbour View Penthouse",
    source: "Referral",
    status: "Negotiating",
    budget: "₦400M+",
    updated: "2 days ago",
  },
  {
    id: "5",
    name: "Chinedu Bassey",
    contact: "chinedu@email.com · 0809…",
    property: "Cedar Grove Estate Plot",
    source: "Manual",
    status: "Qualified",
    budget: "₦40–55M",
    updated: "3 days ago",
  },
];

const stages: Array<LeadStatus | "All"> = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Viewing scheduled",
  "Negotiating",
  "Won",
  "Lost",
];

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number]>("All");
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => {
    return demoLeads.filter((l) => {
      const matchesStage = stage === "All" || l.status === stage;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.property.toLowerCase().includes(q) ||
        l.contact.toLowerCase().includes(q);
      return matchesStage && matchesQuery;
    });
  }, [query, stage]);

  return (
    <AppShell
      title="Leads & clients"
      subtitle="Pipeline for this workspace. Demo records until CRM is wired to Neon."
      actions={
        <button
          className="primary-button"
          onClick={() =>
            setNotice("Manual lead entry will use the createLead server path.")
          }
        >
          <Plus size={17} /> Add lead
        </button>
      }
    >
      {notice && (
        <div className="notice-banner">
          <span>{notice}</span>
          <button aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="lead-stage-row">
        {stages.map((s) => (
          <button
            key={s}
            className={"chip " + (stage === s ? "chip-active" : "")}
            onClick={() => setStage(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="property-toolbar">
          <div className="prop-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, property or contact"
              aria-label="Search leads"
            />
          </div>
          <div className="list-count">
            Showing <strong>{rows.length}</strong> leads
          </div>
        </div>

        <div className="lead-list">
          {rows.map((lead) => (
            <article key={lead.id} className="lead-row">
              <div className="lead-avatar">
                {lead.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="lead-main">
                <div className="lead-title-line">
                  <h3>{lead.name}</h3>
                  <span className={"lead-status status-" + slug(lead.status)}>
                    {lead.status}
                  </span>
                </div>
                <div className="lead-meta">
                  <span>{lead.contact}</span>
                  <span>·</span>
                  <span>{lead.property}</span>
                </div>
                <div className="lead-meta">
                  <span className="lead-source">{lead.source}</span>
                  <span>Budget {lead.budget}</span>
                  <span>{lead.updated}</span>
                </div>
              </div>
              <button
                className="secondary-button lead-action"
                onClick={() =>
                  setNotice("Status updates will write through the leads repository.")
                }
              >
                Update
              </button>
            </article>
          ))}

          {rows.length === 0 && (
            <div className="empty-state">
              <Search size={22} />
              <strong>No leads in this stage</strong>
              <span>Try another filter or clear search.</span>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}
