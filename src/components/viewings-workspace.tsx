"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Clock3, MapPin, Plus, X } from "lucide-react";
import { createViewingAction, updateViewingStatusAction } from "@/app/actions/viewings";
import type { Lead, Property, PropertyViewing, ViewingStatus } from "@/lib/types";
import type { ViewingActivity } from "@/lib/viewings";

const filters: Array<ViewingStatus | "all"> = ["all", "requested", "confirmed", "rescheduled", "completed", "cancelled", "no_show"];
const labels: Record<string, string> = { requested: "Requested", confirmed: "Confirmed", rescheduled: "Rescheduled", completed: "Completed", cancelled: "Cancelled", no_show: "No show" };

export function ViewingsWorkspace({ initialViewings, properties, leads, activities }: { initialViewings: PropertyViewing[]; properties: Property[]; leads: Lead[]; activities: ViewingActivity[] }) {
  const [viewings, setViewings] = useState(initialViewings);
  const [filter, setFilter] = useState<ViewingStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const propertyNames = useMemo(() => new Map(properties.map((property) => [property.id, property.title])), [properties]);
  const leadNames = useMemo(() => new Map(leads.map((lead) => [lead.id, lead.full_name])), [leads]);
  const rows = useMemo(() => viewings.filter((viewing) => filter === "all" || viewing.status === filter).sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()), [viewings, filter]);

  function create(formData: FormData) {
    const date = String(formData.get("scheduled_at") || "");
    const payload = {
      property_id: String(formData.get("property_id") || ""),
      lead_id: String(formData.get("lead_id") || "") || null,
      visitor_name: String(formData.get("visitor_name") || "").trim(),
      visitor_email: String(formData.get("visitor_email") || "").trim() || null,
      visitor_phone: String(formData.get("visitor_phone") || "").trim() || null,
      scheduled_at: new Date(date).toISOString(),
      duration_minutes: Number(formData.get("duration_minutes") || 60),
      notes: String(formData.get("notes") || "").trim() || null,
    };
    startTransition(async () => {
      const result = await createViewingAction(payload);
      if (!result.ok) { setError(result.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function changeStatus(id: string, status: ViewingStatus) {
    startTransition(async () => {
      const result = await updateViewingStatusAction(id, status);
      if (!result.ok) { setError(result.error); return; }
      setViewings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setError("");
    });
  }

  return (
    <>
      <div className="lead-stage-row">{filters.map((item) => <button key={item} className={"chip " + (filter === item ? "chip-active" : "")} onClick={() => setFilter(item)}>{item === "all" ? "All" : labels[item]}</button>)}</div>
      <section className="panel">
        <div className="panel-heading"><div><h2>Schedule</h2><p>{rows.length} appointments in this workspace</p></div><button className="primary-button" onClick={() => { setError(""); setOpen(true); }} disabled={properties.length === 0}><Plus size={16} /> Schedule viewing</button></div>
        {error && <div className="notice-banner" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={15} /></button></div>}
        <div className="viewing-list">
          {rows.map((viewing) => {
            const date = new Date(viewing.scheduled_at);
            return <article key={viewing.id} className="viewing-row">
              <div className="date-tile"><span>{date.toLocaleDateString("en-NG", { month: "short" }).toUpperCase()}</span><strong>{date.getDate()}</strong></div>
              <div className="viewing-main">
                <div className="lead-title-line"><h3>{propertyNames.get(viewing.property_id) || "Property listing"}</h3><span className={"lead-status status-" + viewing.status}>{labels[viewing.status] || viewing.status}</span></div>
                <div className="lead-meta"><span>{viewing.visitor_name}</span>{viewing.lead_id && <span>· {leadNames.get(viewing.lead_id) || "Linked lead"}</span>}</div>
                <div className="lead-meta"><span><Clock3 size={12} /> {date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span><span><MapPin size={12} /> {viewing.duration_minutes} minutes</span></div>
                {activities.filter((activity) => activity.viewing_id === viewing.id).slice(0, 3).length > 0 && <div className="lead-meta" aria-label="Recent viewing activity">{activities.filter((activity) => activity.viewing_id === viewing.id).slice(0, 3).map((activity) => <span key={activity.id}>{activity.action === "viewing.scheduled" ? "Scheduled" : "Status updated"} · {new Date(activity.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}{activity.actor_name ? ` by ${activity.actor_name}` : ""}</span>)}</div>}
              </div>
              <select aria-label={"Update viewing status for " + viewing.visitor_name} value={viewing.status} disabled={pending} onChange={(event) => changeStatus(viewing.id, event.target.value as ViewingStatus)}>{filters.filter((item): item is ViewingStatus => item !== "all").map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
            </article>;
          })}
          {rows.length === 0 && <div className="empty-state"><CalendarDays size={22} /><strong>{viewings.length ? "No appointments in this filter" : "No viewings scheduled"}</strong><span>{viewings.length ? "Choose another status." : "Schedule the first property viewing for this workspace."}</span></div>}
        </div>
      </section>
      {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="viewing-create-title">
          <div className="modal-head"><div><span className="modal-eyebrow">APPOINTMENT MANAGER</span><h2 id="viewing-create-title">Schedule a viewing</h2><p>Link the appointment to a property and optional lead.</p></div><button className="icon-button" aria-label="Close" onClick={() => setOpen(false)} disabled={pending}><X size={18} /></button></div>
          <form action={create}>
            <label>Property<select name="property_id" required defaultValue=""><option value="" disabled>Select property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
            <label>Link lead (optional)<select name="lead_id" defaultValue=""><option value="">No linked lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.full_name}</option>)}</select></label>
            <label>Visitor name<input name="visitor_name" required minLength={2} maxLength={200} /></label>
            <div className="form-two"><label>Email<input name="visitor_email" type="email" /></label><label>Phone<input name="visitor_phone" type="tel" maxLength={30} /></label></div>
            <div className="form-two"><label>Date and time<input name="scheduled_at" type="datetime-local" required min={new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} /></label><label>Duration (minutes)<input name="duration_minutes" type="number" min="15" max="480" step="15" defaultValue="60" /></label></div>
            <label>Notes<textarea name="notes" rows={3} maxLength={2000} /></label>
            {error && <p role="alert" style={{ color: "#a43c35", fontSize: 11 }}>{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? "Saving…" : "Schedule viewing"}</button></div>
          </form>
        </section>
      </div>}
    </>
  );
}
