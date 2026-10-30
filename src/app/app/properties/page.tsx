import { MapPin, BedDouble, Bath, Square, Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PropertyCreateForm } from "@/components/property-create-form";
import { getCurrentAuthContext } from "@/lib/auth";
import { listProperties } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";
import type { Property } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  under_offer: "Under offer",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
};

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString("en-NG")}`;
  }
}

function PropertyCard({ property }: { property: Property }) {
  const location = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ") || "Location not provided";
  const specs = [
    property.bedrooms ? <span key="beds"><BedDouble size={13} /> {property.bedrooms} beds</span> : null,
    property.bathrooms ? <span key="baths"><Bath size={13} /> {property.bathrooms} baths</span> : null,
    property.area_value ? <span key="area"><Square size={13} /> {property.area_value} {property.area_unit || "sqm"}</span> : null,
  ].filter(Boolean);

  return (
    <article className="property-row">
      <div className="property-visual villa"><div className="visual-sun" /><div className="visual-building"><span /><span /><span /></div><div className="visual-initials">RO</div></div>
      <div className="property-main">
        <div className="property-title-line">
          <h3>{property.title}</h3>
          <span className={`status-pill ${property.status === "draft" ? "status-draft" : property.status === "under_offer" ? "status-offer" : property.status === "sold" || property.status === "rented" ? "status-sold" : ""}`}><i />{statusLabels[property.status] || property.status}</span>
        </div>
        <div className="property-location"><MapPin size={13} />{location}</div>
        <div className="property-specs">
          <span>{property.listing_type.replace("_", " ")}</span>
          {specs}
        </div>
        <div className="property-price">{money(property.price, property.currency)}</div>
      </div>
    </article>
  );
}

export default async function PropertiesPage() {
  const context = await getCurrentAuthContext();
  if (!context?.tenant) return null;

  let properties: Property[] = [];
  let databaseUnavailable = false;
  try {
    properties = await listProperties({ tenantId: context.tenant.id, limit: 100 });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  return (
    <AppShell
      title="Properties"
      subtitle={`Live inventory for ${context.tenant.name}.`}
      actions={<PropertyCreateForm />}
    >
      {databaseUnavailable ? (
        <section className="panel"><div className="empty-state"><Building2 size={23} /><strong>Database connection required</strong><span>Property records will appear here once the workspace database is configured.</span></div></section>
      ) : properties.length === 0 ? (
        <section className="panel"><div className="empty-state"><Building2 size={23} /><strong>No properties yet</strong><span>Add your first listing to start building this workspace’s inventory.</span></div></section>
      ) : (
        <section className="panel">
          <div className="property-toolbar">
            <span className="list-count"><strong>{properties.length}</strong> properties in this workspace</span>
            <span className="list-count">Live database records</span>
          </div>
          <div className="property-list">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
          <div className="panel-footer-link" style={{ cursor: "default" }}>Showing {properties.length} workspace listings</div>
        </section>
      )}
    </AppShell>
  );
}
