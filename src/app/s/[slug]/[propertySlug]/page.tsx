import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { getTenantBySlug, getTenantBranding } from "@/lib/tenants";
import { getPropertyBySlug } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { PublicEnquiryForm } from "@/components/public-enquiry-form";

type Props = { params: Promise<{ slug: string; propertySlug: string }> };

export default async function PublicPropertyDetailPage({ params }: Props) {
  const { slug, propertySlug } = await params;

  let tenant = null;
  let branding = null;
  let property = null;
  let dbError = false;

  try {
    tenant = await getTenantBySlug(slug);
    if (tenant) {
      branding = await getTenantBranding(tenant.id);
      property = await getPropertyBySlug(tenant.id, propertySlug);
      if (property && property.status !== "published") {
        property = null;
      }
    }
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      dbError = true;
    } else {
      throw err;
    }
  }

  const name = tenant?.name ?? formatSlug(slug);
  const primary = branding?.primary_color ?? "#12634b";

  return (
    <div
      className="public-site"
      style={{ ["--tenant-primary" as string]: primary }}
    >
      <header className="pub-nav">
        <div className="pub-nav-inner">
          <Link href={`/s/${slug}`} className="pub-brand">
            <div className="brand-mark" style={{ background: primary }}>
              <Building2 size={18} strokeWidth={2.1} />
            </div>
            <strong>{name}</strong>
          </Link>
          <nav>
            <Link href={`/s/${slug}`}>All listings</Link>
            <Link href="/login" className="pub-sign-in">
              Agent login
            </Link>
          </nav>
        </div>
      </header>

      <section className="pub-section">
        <div className="pub-section-inner pub-detail">
          <Link href={`/s/${slug}`} className="pub-back">
            <ArrowLeft size={15} /> Back to listings
          </Link>

          {dbError && (
            <div className="pub-empty">
              <Building2 size={28} />
              <strong>Database not connected</strong>
              <span>
                Property detail will load from Neon when DATABASE_URL is set.
              </span>
            </div>
          )}

          {!dbError && !property && (
            <div className="pub-empty">
              <Building2 size={28} />
              <strong>Listing not available</strong>
              <span>
                This property is not published for this workspace, or the link is
                incorrect.
              </span>
            </div>
          )}

          {property && (
            <div className="pub-detail-grid">
              <div>
                <div className="pub-detail-visual" />
                <h1>{property.title}</h1>
                <div className="pub-card-loc">
                  <MapPin size={14} />
                  {[property.address, property.city, property.state]
                    .filter(Boolean)
                    .join(", ") || "Nigeria"}
                </div>
                <div className="pub-card-price pub-detail-price">
                  {formatMoney(property.price, property.currency)}
                  {property.price_period ? ` / ${property.price_period}` : ""}
                </div>
                <div className="pub-specs">
                  {property.bedrooms != null && (
                    <span>{property.bedrooms} beds</span>
                  )}
                  {property.bathrooms != null && (
                    <span>{property.bathrooms} baths</span>
                  )}
                  {property.area_value != null && (
                    <span>
                      {property.area_value} {property.area_unit || "sqm"}
                    </span>
                  )}
                  <span className="pub-listing-type">{property.listing_type}</span>
                </div>
                {property.description && (
                  <p className="pub-description">{property.description}</p>
                )}
              </div>
              <aside className="pub-detail-aside">
                <h2>Enquire about this property</h2>
                <p>Your message goes to {name} as a lead in RealtyOS.</p>
                <PublicEnquiryForm
                  workspaceSlug={slug}
                  propertySlug={propertySlug}
                />
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
