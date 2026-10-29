"use client";

import { useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Agent" | "Editor" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
};

const demoMembers: Member[] = [
  {
    id: "1",
    name: "Godwin O.",
    email: "godwin@gbest.example",
    role: "Owner",
    status: "Active",
  },
  {
    id: "2",
    name: "Amaka Kingsley",
    email: "amaka@gbest.example",
    role: "Agent",
    status: "Active",
  },
  {
    id: "3",
    name: "Tunde Okonkwo",
    email: "tunde@gbest.example",
    role: "Admin",
    status: "Active",
  },
  {
    id: "4",
    name: "Efe Oghene",
    email: "efe@gbest.example",
    role: "Agent",
    status: "Invited",
  },
];

export default function TeamPage() {
  const [notice, setNotice] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  return (
    <AppShell
      title="Team members"
      subtitle="Roles and invitations for this workspace. Demo roster until memberships are live."
      actions={
        <button className="primary-button" onClick={() => setShowInvite(true)}>
          <Plus size={17} /> Invite member
        </button>
      }
    >
      {notice && (
        <div className="notice-banner">
          <ShieldCheck size={17} />
          <span>{notice}</span>
          <button aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Workspace team</h2>
            <p>Owners, admins, agents and editors with server-side roles.</p>
          </div>
        </div>
        <div className="team-list">
          {demoMembers.map((m) => (
            <article key={m.id} className="team-row">
              <div className="lead-avatar">
                {m.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="lead-main">
                <div className="lead-title-line">
                  <h3>{m.name}</h3>
                  <span className={"lead-status status-" + m.status.toLowerCase()}>
                    {m.status}
                  </span>
                </div>
                <div className="lead-meta">
                  <span>{m.email}</span>
                  <span>·</span>
                  <span className="lead-source">{m.role}</span>
                </div>
              </div>
              {m.role !== "Owner" && (
                <button
                  className="secondary-button lead-action"
                  onClick={() =>
                    setNotice(
                      "Role and status changes will use the memberships repository."
                    )
                  }
                >
                  Manage
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {showInvite && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowInvite(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <span className="modal-eyebrow">TEAM</span>
                <h2>Invite a member</h2>
                <p>They join only this workspace, with the role you assign.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowInvite(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowInvite(false);
                setNotice(
                  "Invite flow is ready in memberships.ts. Auth + email delivery come next."
                );
              }}
            >
              <label>
                Email
                <input required type="email" placeholder="agent@agency.com" />
              </label>
              <label>
                Role
                <select defaultValue="agent">
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Send invite
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
