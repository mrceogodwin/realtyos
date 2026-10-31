"use client";

import { useState, useTransition } from "react";
import { updateTeamMemberAccessAction } from "@/app/actions/team";

type MemberAccess = { id: string; role: "owner" | "admin" | "agent" | "editor" | "viewer"; status: "active" | "invited" | "suspended" | "revoked" };

export function TeamMemberAccessControl({ member, canManageAdmin }: { member: MemberAccess; canManageAdmin: boolean }) {
  const [role, setRole] = useState(member.role);
  const [status, setStatus] = useState<"active" | "suspended">(member.status === "suspended" ? "suspended" : "active");
  const [savedRole, setSavedRole] = useState(member.role);
  const [savedStatus, setSavedStatus] = useState<"active" | "suspended">(member.status === "suspended" ? "suspended" : "active");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const locked = member.role === "owner" || (member.role === "admin" && !canManageAdmin);

  function save() {
    setError("");
    startTransition(async () => {
      const result = await updateTeamMemberAccessAction({ membershipId: member.id, role, status });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedRole(role);
      setSavedStatus(status);
      window.location.reload();
    });
  }

  if (locked) return <span className="team-access-locked">{member.role === "owner" ? "Owner" : "Admin access"}</span>;
  const dirty = role !== savedRole || status !== savedStatus;
  return (
    <div className="team-access-control">
      <select aria-label="Member role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
        {canManageAdmin && <option value="admin">Admin</option>}
        <option value="agent">Agent</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
      </select>
      <select aria-label="Member status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
        <option value="active">Active</option><option value="suspended">Suspended</option>
      </select>
      {dirty && <button type="button" className="secondary-button" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save"}</button>}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}
