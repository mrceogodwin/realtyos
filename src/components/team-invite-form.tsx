"use client";

import { useState, useTransition } from "react";
import { Check, Copy, LoaderCircle, Send } from "lucide-react";
import { createTeamInvitationAction } from "@/app/actions/team";

export function TeamInviteForm({ canInviteAdmin = false }: { canInviteAdmin?: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setInviteUrl("");
    startTransition(async () => {
      const result = await createTeamInvitationAction({ email, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInviteUrl(result.data.invitationUrl);
      setMessage(`Invitation created for ${result.data.email}. Share this secure link with them; it expires in 7 days.`);
      setEmail("");
    });
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setError("Could not copy automatically. Select and copy the invitation link.");
    }
  }

  return (
    <div className="team-invite-form">
      <form className="auth-form" onSubmit={submit}>
        <label>
          Email address
          <input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agent@agency.com" />
        </label>
        <label>
          Workspace role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="agent">Agent</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            {canInviteAdmin && <option value="admin">Admin</option>}
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle size={16} /> : <Send size={16} />}
          {pending ? "Creating invitation…" : "Create invitation"}
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      {inviteUrl && (
        <div className="panel" style={{ marginTop: 16 }}>
          <label htmlFor="team-invite-url">Secure invitation link</label>
          <input id="team-invite-url" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="secondary-button" onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy invitation link"}
          </button>
          <p className="empty-state">Email delivery is not configured yet. Share this link only with the invited person.</p>
        </div>
      )}
    </div>
  );
}
