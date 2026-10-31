"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { createLeadAction, updateLeadStatusAction, updateLeadWorkflowAction } from "@/app/actions/leads";
import type { Lead, LeadStatus } from "@/lib/types";

const stages: Array<LeadStatus | "all"> = ["all", "new", "contacted", "qualified", "viewing_scheduled", "negotiating", "won", "lost"];
const labels: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", viewing_scheduled: "Viewing scheduled", negotiating: "Negotiating", won: "Won", lost: "Lost", spam: "Spam" };

type AgentOption = { user_id: string; full_name: string | null; email: string };

export function LeadsWorkspace({ initialLeads, agents }: { initialLeads: Lead[]; agents: AgentOption[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStatus | "all">("all");
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => leads.filter((lead) => {
    const matchesStage = stage === "all" || lead.status === stage;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [lead.full_name, lead.email || "", lead.phone || "", lead.preferred_location || ""].some((value) => value.toLowerCase().includes(q));
    return matchesStage && matchesQuery;
  }), [leads, query, stage]);

  function create(formData: FormData) {
    const payload = {
      full_name: String(formData.get("full_name") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      source: String(formData.get("source") || "manual"),
      preferred_location: String(formData.get("preferred_location") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    };
    startTransition(async () => {
      const result = await createLeadAction(payload);
      if (!result.ok) { setError(result.error); return; }
      setOpen(false);
      window.location.reload();
    });
  }

  function changeStatus(id: string, status: LeadStatus) {
    startTransition(async () => {
      const result = await updateLeadStatusAction(id, status);
      if (!result.ok) { setError(result.error); return; }
      setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
      setError("");
    });
  }

  function saveWorkflow(lead: Lead) {
    const followUpValue = followUps[lead.id] ?? (lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().slice(0, 16) : "");
    const assignedAgentId = assignments[lead.id] !== undefined ? (assignments[lead.id] || null) : lead.assigned_agent_id;
    startTransition(async () => {
      const result = await updateLeadWorkflowAction({
        leadId: lead.id,
        status: lead.status,
        assignedAgentId,
        followUpAt: followUpValue ? new Date(followUpValue).toISOString() : null,
      });
      if (!result.ok) { setError(result.error); return; }
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, assigned_agent_id: assignedAgentId, follow_up_at: followUpValue ? new Date(followUpValue).toISOString() : null } : item));
      setError("");
    });
  }

  return (
    <>
      <div className="lead-stage-row">{stages.map((item) => <button key={item} className={"chip " + (stage === item ? "chip-active" : "")} onClick={() => setStage(item)}>{item === "all" ? "All" : labels[item]}</button>)}</div>
      <section className="panel">
        <div className="property-toolbar">
          <div className="prop-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone or location" aria-label="Search leads" /></div>
          <span className="list-count">Showing <strong>{rows.length}</strong> of {leads.length}</span>
          <button className="primary-button" onClick={() => { setError(""); setOpen(true); }}><Plus size={16} /> Add lead</button>
        </div>
        {error && <div className="notice-banner" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={15} /></button></div>}
        <div className="lead-list">
          {rows.map((lead) => (
            <article key={lead.id} className="lead-row">
              <div className="lead-avatar">{lead.full_name.split(" ").map((part) => part[0]).slice(0,2).join("").toUpperCase()}</div>
              <div className="lead-main">
                <div className="lead-title-line"><h3>{lead.full_name}</h3><span className={"lead-status status-" + lead.status}>{labels[lead.status] || lead.status}</span></div>
                <div className="lead-meta"><span>{lead.email || "No email"}</span><span>·</span><span>{lead.phone || "No phone"}</span></div>
                <div className="lead-meta"><span>{lead.source.replace("_", " ")}</span>{lead.preferred_location && <span>· {lead.preferred_location}</span>}<span>Added {new Date(lead.created_at).toLocaleDateString()}</span></div>
              </div>
              <div className="lead-workflow-controls">
                <label>Follow-up <input type="datetime-local" aria-label={"Follow-up for " + lead.full_name} value={followUps[lead.id] ?? (lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().slice(0, 16) : "")} onChange={(event) => setFollowUps((current) => ({ ...current, [lead.id]: event.target.value }))} /></label>
                <label>Assigned to <select aria-label={"Assign " + lead.full_name} value={assignments[lead.id] ?? lead.assigned_agent_id ?? ""} onChange={(event) => setAssignments((current) => ({ ...current, [lead.id]: event.target.value }))}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.user_id} value={agent.user_id}>{agent.full_name || agent.email}</option>)}</select></label>
                <button type="button" className="secondary-button" disabled={pending} onClick={() => saveWorkflow(lead)}>Save</button>
              </div>
              <select aria-label={"Update status for " + lead.full_name} value={lead.status} disabled={pending} onChange={(event) => changeStatus(lead.id, event.target.value as LeadStatus)}>{stages.filter((item): item is LeadStatus => item !== "all").map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
            </article>
          ))}
          {rows.length === 0 && <div className="empty-state"><Search size={22} /><strong>{leads.length ? "No leads match" : "No leads yet"}</strong><span>{leads.length ? "Try another search or stage." : "Add your first client lead to start the pipeline."}</span></div>}
        </div>
      </section>
      {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-create-title">
          <div className="modal-head"><div><span className="modal-eyebrow">CLIENT RELATIONSHIP</span><h2 id="lead-create-title">Add a lead</h2><p>Save a new enquiry to this workspace.</p></div><button className="icon-button" aria-label="Close" onClick={() => setOpen(false)} disabled={pending}><X size={18} /></button></div>
          <form action={create}>
            <label>Full name<input name="full_name" required minLength={2} maxLength={200} /></label>
            <div className="form-two"><label>Email<input name="email" type="email" /></label><label>Phone<input name="phone" type="tel" maxLength={30} /></label></div>
            <div className="form-two"><label>Source<select name="source" defaultValue="manual"><option value="manual">Manual</option><option value="website">Website</option><option value="referral">Referral</option><option value="enquiry">Enquiry</option><option value="other">Other</option></select></label><label>Preferred location<input name="preferred_location" maxLength={200} /></label></div>
            <label>Notes<textarea name="notes" rows={3} maxLength={5000} /></label>
            <div className="modal-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? "Saving…" : "Create lead"}</button></div>
          </form>
        </section>
      </div>}
    </>
  );
}
