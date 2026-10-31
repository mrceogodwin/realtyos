"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updatePropertyAction } from "@/app/actions/properties";
import type { Property } from "@/lib/types";

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
}

export function PropertyEditForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const rawPrice = Number(formData.get("price"));
    const payload = {
      propertyId: property.id,
      property: {
        title,
        slug: makeSlug(title),
        description: String(formData.get("description") || "").trim() || null,
        listing_type: String(formData.get("listing_type") || "sale"),
        property_type_id: property.property_type_id,
        status: property.status,
        price: rawPrice,
        currency: property.currency || "NGN",
        price_period: property.price_period,
        bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
        bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
        toilets: property.toilets,
        parking_spaces: property.parking_spaces,
        area_value: formData.get("area_value") ? Number(formData.get("area_value")) : null,
        area_unit: property.area_unit || "sqm",
        address: String(formData.get("address") || "").trim() || null,
        city: String(formData.get("city") || "").trim() || null,
        state: String(formData.get("state") || "").trim() || null,
        country: property.country || "NG",
        features: property.features || [],
        assigned_agent_id: property.assigned_agent_id,
      },
    };
    startTransition(async () => {
      const result = await updatePropertyAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <>
      <button type="button" className="secondary-button property-edit-trigger" onClick={() => { setError(""); setOpen(true); }}>
        <Pencil size={13} /> Edit details
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby={`property-edit-${property.id}`}>
            <div className="modal-head">
              <div><span className="modal-eyebrow">PROPERTY MANAGER</span><h2 id={`property-edit-${property.id}`}>Edit property</h2><p>Changes apply only to this workspace listing.</p></div>
              <button type="button" className="icon-button" aria-label="Close" disabled={pending} onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form action={submit}>
              <label>Property name<input name="title" required minLength={3} maxLength={200} defaultValue={property.title} /></label>
              <div className="form-two">
                <label>Listing type<select name="listing_type" defaultValue={property.listing_type}><option value="sale">For sale</option><option value="rent">For rent</option><option value="lease">For lease</option><option value="short_let">Short let</option></select></label>
                <label>Asking price<input name="price" type="number" min="0" step="0.01" required defaultValue={property.price} /></label>
              </div>
              <label>Description<textarea name="description" rows={3} maxLength={10000} defaultValue={property.description || ""} /></label>
              <label>Street address<input name="address" maxLength={500} defaultValue={property.address || ""} /></label>
              <div className="form-two">
                <label>City<input name="city" maxLength={120} defaultValue={property.city || ""} /></label>
                <label>State<input name="state" maxLength={120} defaultValue={property.state || ""} /></label>
              </div>
              <div className="form-two">
                <label>Bedrooms<input name="bedrooms" type="number" min="0" step="1" defaultValue={property.bedrooms ?? ""} /></label>
                <label>Bathrooms<input name="bathrooms" type="number" min="0" step="1" defaultValue={property.bathrooms ?? ""} /></label>
              </div>
              <label>Area (sqm)<input name="area_value" type="number" min="0" step="0.01" defaultValue={property.area_value ?? ""} /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="modal-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
