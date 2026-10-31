"use client";

import { useState, useTransition } from "react";
import { updatePropertyStatusAction } from "@/app/actions/properties";
import type { PropertyStatus } from "@/lib/types";

const labels: Record<PropertyStatus, string> = {
  draft: "Draft",
  published: "Published",
  under_offer: "Under offer",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
};

export function PropertyStatusControl({
  propertyId,
  initialStatus,
}: {
  propertyId: string;
  initialStatus: PropertyStatus;
}) {
  const [status, setStatus] = useState<PropertyStatus>(initialStatus);
  const [savedStatus, setSavedStatus] = useState<PropertyStatus>(initialStatus);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    startTransition(async () => {
      const result = await updatePropertyStatusAction({ propertyId, status });
      if (!result.ok) {
        setError(result.error);
        setStatus(savedStatus);
        return;
      }
      setSavedStatus(status);
      window.location.reload();
    });
  }

  return (
    <div className="property-status-control">
      <label className="sr-only" htmlFor={`property-status-${propertyId}`}>Listing status</label>
      <select
        id={`property-status-${propertyId}`}
        value={status}
        disabled={pending}
        onChange={(event) => setStatus(event.target.value as PropertyStatus)}
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {status !== savedStatus && (
        <button type="button" className="secondary-button" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </button>
      )}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}
