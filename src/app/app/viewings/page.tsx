"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type ViewingStatus =
  | "Requested"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "No show";

type Viewing = {
  id: string;
  property: string;
  visitor: string;
  location: string;
  when: string;
  day: string;
  month: string;
  status: ViewingStatus;
  agent: string;
};

const demoViewings: Viewing[] = [
  {
    id: "1",
    property: "The Meridian Residence",
    visitor: "Efe Oghene",
    location: "Lekki Phase 1, Lagos",
    when: "Tomorrow · 10:30 AM",
    day: "30",
    month: "OCT",
    status: "Confirmed",
    agent: "You",
  },
  {
    id: "2",
    property: "Palm Court Apartments",
    visitor: "Tunde Okonkwo",
    location: "Victoria Island, Lagos",
    when: "Saturday · 12:00 PM",
    day: "31",
    month: "OCT",
    status: "Requested",
    agent: "Amaka K.",
  },
  {
    id: "3",
    property: "Harbour View Penthouse",
    visitor: "Ngozi Adeyemi",
    location: "Ikoyi, Lagos",
    when: "Mon 3 Nov · 3:00 PM",
    day: "03",
    month: "NOV",
    status: "Confirmed",
    agent: "You",
  },
  {
    id: "4",
    property: "Olive Crest Duplex",
    visitor: "Chinedu Bassey",
    location: "GRA, Benin City",
    when: "Last week · Completed",
    day: "22",
    month: "OCT",
    status: "Completed",
    agent: "Efe O.",
  },
];

const filters: Array<ViewingStatus | "All"> = [
  "All",
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No show",
];

export default function ViewingsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [notice, setNotice] = useState("");

  const rows = useMemo(
    () =>
      demoViewings.filter((v) => filter === "All" || v.status === filter),
    [filter]
  );

  return (
    <AppShell
      title="Viewings"
      subtitle="Appointments linked to properties and leads. Demo schedule until the calendar is wired to Neon."
      actions={
        <button
          className="primary-button"
          onClick={() =>
            setNotice("Manual viewing creation will use the viewings repository.")
          }
        >
          <Plus size={17} /> Schedule viewing
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
        {filters.map((f) => (
          <button
            key={f}
            className={"chip " + (filter === f ? "chip-active" : "")}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Schedule</h2>
            <p>Upcoming and recent viewing appointments.</p>
          </div>
          <CalendarDays size={18} className="muted-icon" />
        </div>

        <div className="viewing-list">
          {rows.map((v) => (
            <article key={v.id} className="viewing-row">
              <div className="date-tile">
                <span>{v.month}</span>
                <strong>{v.day}</strong>
              </div>
              <div className="viewing-main">
                <div className="lead-title-line">
                  <h3>{v.property}</h3>
                  <span className={"lead-status status-" + slug(v.status)}>
                    {v.status}
                  </span>
                </div>
                <div className="lead-meta">
                  <span>{v.visitor}</span>
                  <span>·</span>
                  <span>Agent {v.agent}</span>
                </div>
                <div className="lead-meta">
                  <span>
                    <Clock3 size={12} style={{ verticalAlign: "-2px" }} /> {v.when}
                  </span>
                  <span>
                    <MapPin size={12} style={{ verticalAlign: "-2px" }} />{" "}
                    {v.location}
                  </span>
                </div>
              </div>
              <button
                className="secondary-button lead-action"
                onClick={() =>
                  setNotice("Status changes will update property_viewings in the database.")
                }
              >
                Manage
              </button>
            </article>
          ))}

          {rows.length === 0 && (
            <div className="empty-state">
              <CalendarDays size={22} />
              <strong>No viewings in this filter</strong>
              <span>Try another status or schedule a new appointment.</span>
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
