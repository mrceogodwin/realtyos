"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { revokeTeamInvitationAction } from "@/app/actions/team";

export function TeamInvitationList({ invitations }: { invitations: { id: string; email: string; role: string; expires_at: string }[] }) {
  const [items, setItems] = useState(invitations);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [pending, startTransition] = useTransition();

  function revoke(id: string) {
    if (!window.confirm("Revoke this invitation? The existing link will stop working.")) return;
    setError("");
    setPendingId(id);
    startTransition(async () => {
      const result = await revokeTeamInvitationAction({ invitationId: id });
      if (!result.ok) setError(result.error);
      else setItems((current) => current.filter((item) => item.id !== id));
      setPendingId("");
    });
  }

  if (items.length === 0) return <p className="empty-state">There are no pending invitations.</p>;
  return (
    <div className="team-invitation-list">
      {items.map((item) => (
        <article className="team-invitation-row" key={item.id}>
          <div><strong>{item.email}</strong><span>{item.role} · Expires {new Date(item.expires_at).toLocaleDateString()}</span></div>
          <button type="button" className="secondary-button" disabled={pending} onClick={() => revoke(item.id)} aria-label={`Revoke invitation for ${item.email}`}>
            <X size={14} /> {pendingId === item.id ? "Revoking…" : "Revoke"}
          </button>
        </article>
      ))}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
