"use client";

import { useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

type PropertyRow = {
  id: string;
  name: string;
  location: string;
  price: string;
  status: "Published" | "Draft" | "Under offer" | "Sold";
  type: string;
  beds: number;
  baths: number;
  area: string;
  tone: string;
  initials: string;
};

const demoProperties: PropertyRow[] = [
  {
    id: "1",
    name: "The Meridian Residence",
    location: "Lekki Phase 1, Lagos",
    price: "₦285,000,000",
    status: "Published",
    type: "House / duplex",
    beds: 5,
    baths: 6,
    area: "620 sqm",
    tone: "villa",
    initials: "MR",
  },
  {
    id: "2",
    name: "Palm Court Apartments",
    location: "Victoria Island, Lagos",
    price: "₦95,000,000",
    status: "Published",
    type: "Apartment",
    beds: 3,
    baths: 3,
    area: "180 sqm",
    tone: "apartments",
    initials: "PC",
  },
  {
    id: "3",
    name: "Olive Crest Duplex",
    location: "GRA, Benin City",
    price: "₦165,000,000",
    status: "Draft",
    type: "House / duplex",
    beds: 4,
    baths: 5,
    area: "410 sqm",
    tone: "duplex",
    initials: "OC",
  },
  {
    id: "4",
    name: "Harbour View Penthouse",
    location: "Ikoyi, Lagos",
    price: "₦420,000,000",
    status: "Under offer",
    type: "Apartment",
    beds: 4,
    baths: 5,
    area: "310 sqm",
    tone: "apartments",
    initials: "HV",
  },
  {
    id: "5",
    name: "Cedar Grove Estate Plot",
    location: "Sangotedo, Lagos",
    price: "₦48,000,000",
    status: "Published",
    type: "Land",
    beds: 0,
    baths: 0,
    area: "600 sqm",
    tone: "duplex",
    initials: "CG",
  },
];

const filters = ["All", "Published", "Draft", "Under offer", "Sold"] as const;

export default function PropertiesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [showNew, setShowNew] = useState(false);
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => {
    return demoProperties.filter((p) => {
      const matchesFilter = filter === "All" || p.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <AppShell
      title="Properties"
      subtitle="Inventory for this workspace. Demo data until DATABASE_URL and auth are connected."
      actions={
        <button className="primary-button" onClick={() => setShowNew(true)}>
          <Plus size={17} /> Add property
        </button>
      }
    >
      {notice && (
        <div className="notice-banner">
          <span>{notice}</span>
          <button aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="property-toolbar prop-toolbar-rich">
          <div className="prop-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or location"
              aria-label="Search properties"
            />
          </div>
          <div className="prop-filters">
            {filters.map((f) => (
              <button
                key={f}
                className={"chip " + (filter === f ? "chip-active" : "")}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="filter-button" type="button">
            <SlidersHorizontal size={15} /> More filters
          </button>
        </div>

        <div className="property-list">
          {rows.map((property) => (
            <article key={property.id} className="property-row">
              <div className={"property-visual " + property.tone}>
                <div className="visual-sun" />
                <div className="visual-building">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="visual-initials">{property.initials}</div>
              </div>
              <div className="property-main">
                <div className="property-title-line">
                  <h3>{property.name}</h3>
                  <span
                    className={
                      "status-pill " +
                      (property.status === "Draft"
                        ? "status-draft"
                        : property.status === "Under offer"
                          ? "status-offer"
                          : property.status === "Sold"
                            ? "status-sold"
                            : "")
                    }
                  >
                    <i />
                    {property.status}
                  </span>
                </div>
                <div className="property-location">
                  <MapPin size={13} />
                  {property.location}
                </div>
                <div className="property-specs">
                  <span>{property.type}</span>
                  {property.beds > 0 && (
                    <span>
                      <BedDouble size={14} />
                      {property.beds} beds
                    </span>
                  )}
                  {property.baths > 0 && (
                    <span>
                      <Bath size={14} />
                      {property.baths} baths
                    </span>
                  )}
                  <span>
                    <Square size={13} />
                    {property.area}
                  </span>
                </div>
                <div className="property-price">{property.price}</div>
              </div>
              <button
                className="icon-button property-more"
                aria-label={"Options for " + property.name}
                onClick={() =>
                  setNotice("Property actions will connect to real CRUD next.")
                }
              >
                <MoreHorizontal size={18} />
              </button>
            </article>
          ))}

          {rows.length === 0 && (
            <div className="empty-state">
              <Search size={22} />
              <strong>No properties match</strong>
              <span>Try another filter or search term.</span>
            </div>
          )}
        </div>

        <div className="panel-footer-link" style={{ cursor: "default" }}>
          Showing {rows.length} of {demoProperties.length} demo listings
        </div>
      </section>

      {showNew && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNew(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="modal-eyebrow">PROPERTY MANAGER</span>
                <h2 id="modal-title">Add a property</h2>
                <p>Persists to Neon once DATABASE_URL and tenant auth are live.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowNew(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowNew(false);
                setNotice(
                  "Form validated in UI. Server action is ready — awaiting database connection."
                );
              }}
            >
              <label>
                Property name
                <input required placeholder="e.g. The Meridian Residence" />
              </label>
              <div className="form-two">
                <label>
                  Listing type
                  <select defaultValue="sale">
                    <option value="sale">For sale</option>
                    <option value="rent">For rent</option>
                    <option value="short_let">Short let</option>
                  </select>
                </label>
                <label>
                  Property type
                  <select defaultValue="house">
                    <option value="house">House / duplex</option>
                    <option value="apartment">Apartment</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </label>
              </div>
              <label>
                Location
                <input required placeholder="Area, city, state" />
              </label>
              <label>
                Asking price (₦)
                <input required type="number" min={0} placeholder="e.g. 285000000" />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowNew(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Plus size={16} /> Create listing
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
