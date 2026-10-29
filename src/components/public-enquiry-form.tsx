"use client";

import { useState } from "react";
import { createPublicEnquiryAction } from "@/app/actions/public-enquiry";

export function PublicEnquiryForm({
  workspaceSlug,
  propertySlug,
}: {
  workspaceSlug: string;
  propertySlug?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    setDone(false);

    const form = new FormData(e.currentTarget);
    const result = await createPublicEnquiryAction({
      workspaceSlug,
      propertySlug: propertySlug ?? null,
      full_name: String(form.get("full_name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      notes: String(form.get("notes") || ""),
    });

    setPending(false);
    if (result.ok) {
      setDone(true);
      e.currentTarget.reset();
      return;
    }
    setError(result.error);
  }

  return (
    <form className="pub-enquiry" onSubmit={onSubmit}>
      <label>
        Full name
        <input name="full_name" required placeholder="Your name" />
      </label>
      <div className="pub-enquiry-row">
        <label>
          Email
          <input name="email" type="email" placeholder="you@email.com" />
        </label>
        <label>
          Phone
          <input name="phone" placeholder="080…" />
        </label>
      </div>
      <label>
        Message
        <textarea name="notes" rows={3} placeholder="I’m interested in…" />
      </label>
      {error && <p className="form-error">{error}</p>}
      {done && (
        <p className="form-success">
          Enquiry sent. The agency will follow up from their RealtyOS workspace.
        </p>
      )}
      <button type="submit" className="primary-button" disabled={pending}>
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
