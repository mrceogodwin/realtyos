"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { acceptTeamInvitationAction } from "@/app/actions/team";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function accept() {
    setError("");
    startTransition(async () => {
      const result = await acceptTeamInvitationAction(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/app");
      router.refresh();
    });
  }

  return (
    <div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button auth-submit" onClick={accept} disabled={pending}>
        {pending ? <LoaderCircle size={17} /> : <CheckCircle2 size={17} />}
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
    </div>
  );
}
