"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createPropertyAction } from "@/app/actions/properties";

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
}

export function PropertyCreateForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const rawPrice = Number(formData.get("price"));
    const payload = {
      title,
      slug: makeSlug(title),
      listing_type: String(formData.get("listing_type") || "sale"),
      status: "draft",
      price: rawPrice,
      currency: "NGN",
      country: "NG",
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
      bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
      area_value: formData.get("area_value") ? Number(formData.get("area_value")) : null,
      area_unit: "sqm",
    };
    startTransition(async () => {
      const result = await createPropertyAction(payload);
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
      <button className="primary-button" onClick={() => { setError(""); setOpen(true); }}><Plus size={17} /> Add property</button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="property-create-title">
            <div className="modal-head"><div><span className="modal-eyebrow">PROPERTY MANAGER</span><h2 id="property-create-title">Add a property</h2><p>This listing will be saved to the active workspace.</p></div><button className="icon-button" aria-label="Close" disabled={pending} onClick={() => setOpen(false)}><X size={18} /></button></div>
            <form action={submit}>
              <label>Property name<input name="title" required minLength={3} maxLength={200} placeholder="e.g. Meridian Residence" /></label>
              <div className="form-two">
                <label>Listing type<select name="listing_type" defaultValue="sale"><option value="sale">For sale</option><option value="rent">For rent</option><option value="lease">For lease</option><option value="short_let">Short let</option></select></label>
                <label>Asking price (₦)<input name="price" type="number" min="0" step="0.01" required placeholder="285000000" /></label>
              </div>
              <label>Street address<input name="address" maxLength={500} placeholder="Street and neighbourhood" /></label>
              <div className="form-two">
                <label>City<input name="city" maxLength={120} placeholder="Lagos" /></label>
                <label>State<input name="state" maxLength={120} placeholder="Lagos State" /></label>
              </div>
              <div className="form-two">
                <label>Bedrooms<input name="bedrooms" type="number" min="0" step="1" /></label>
                <label>Bathrooms<input name="bathrooms" type="number" min="0" step="1" /></label>
              </div>
              <label>Area (sqm)<input name="area_value" type="number" min="0" step="0.01" /></label>
              {error && <p role="alert" style={{ color: "#a43c35", fontSize: 11, margin: 0 }}>{error}</p>}
              <div className="modal-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? "Saving…" : "Create draft listing"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
