"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, LoaderCircle } from "lucide-react";
import { switchWorkspaceAction } from "@/app/actions/workspace";

type WorkspaceOption = { tenant_id: string; name: string; slug: string; role: string };

export function WorkspacePicker({ workspaces, activeTenantId }: { workspaces: WorkspaceOption[]; activeTenantId: string | null }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function switchTo(tenantId: string) {
    setError("");
    setPendingId(tenantId);
    startTransition(async () => {
      const result = await switchWorkspaceAction(tenantId);
      if (!result.ok) {
        setError(result.error);
        setPendingId(null);
        return;
      }
      router.replace("/app");
      router.refresh();
    });
  }

  if (workspaces.length === 0) return <p className="empty-state">No active workspaces are linked to this account.</p>;

  return (
    <div className="team-list">
      {workspaces.map((workspace) => {
        const active = workspace.tenant_id === activeTenantId;
        return (
          <article key={workspace.tenant_id} className="team-row">
            <div className="lead-avatar">{workspace.name.slice(0, 1).toUpperCase()}</div>
            <div className="lead-main">
              <div className="lead-title-line"><h3>{workspace.name}</h3>{active && <span className="lead-status status-active">Current</span>}</div>
              <div className="lead-meta"><span>/{workspace.slug}</span><span>·</span><span className="lead-source">{workspace.role}</span></div>
            </div>
            <button className="secondary-button" disabled={active || isPending} onClick={() => switchTo(workspace.tenant_id)}>
              {pendingId === workspace.tenant_id && isPending ? <LoaderCircle size={16} /> : active ? <Check size={16} /> : <ChevronRight size={16} />}
              {active ? "Active" : "Switch"}
            </button>
          </article>
        );
      })}
      {error && <p role="alert" className="empty-state">{error}</p>}
    </div>
  );
}
