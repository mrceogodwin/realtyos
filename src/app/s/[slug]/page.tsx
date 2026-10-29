import Link from "next/link";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { getTenantBySlug, getTenantBranding, getTenantSettings } from "@/lib/tenants";
import { listPublishedProperties } from "@/lib/properties";
import { DatabaseNotConfiguredError } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicTenantSitePage({ params }: Props) {
  const { slug } = await params;

  let tenant = null;
  let branding = null;
  let settings = null;
  let properties: Awaited<ReturnType<typeof listPublishedProperties>> = [];
  let dbError = false;

  try {
    tenant = await getTenantBySlug(slug);
    if (tenant) {
      branding = await getTenantBranding(tenant.id);
      settings = await getTenantSettings(tenant.id);
      properties = await listPublishedProperties(tenant.id, 12);
    }
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      dbError = true;
    } else {
      throw err;
    }
  }

  // Demo fallback when DB is offline or slug not found — shows the shell design
  const name = tenant?.name ?? formatSlug(slug);
  const primary = branding?.primary_color ?? "#12634b";
  const accent = branding?.accent_color ?? "#c6a36b";
  const heroTitle =
    branding?.hero_title ?? `Find your next home with ${name}`;
  const heroSubtitle =
    branding?.hero_subtitle ??
    "Premium properties curated for serious buyers and renters.";
  const seoDescription =
    settings?.seo_description ?? `${name} on RealtyOS.`;

  return (
    <div className="public-site" style={{ ["--tenant-primary" as string]: primary, ["--tenant-accent" as string]: accent }}>
      <header className="pub-nav">
        <div className="pub-nav-inner">
          <div className="pub-brand">
            <div className="brand-mark" style={{ background: primary }}>
              <Building2 size={18} strokeWidth={2.1} />
            </div>
            <strong>{name}</strong>
          </div>
          <nav>
            <a href="#listings">Listings</a>
            <a href="#contact">Contact</a>
            <Link href="/login" className="pub-sign-in">
              Agent login
            </Link>
          </nav>
        </div>
      </header>

      <section className="pub-hero">
        <div className="pub-hero-inner">
          <p className="pub-eyebrow">Powered by RealtyOS</p>
          <h1>{heroTitle}</h1>
          <p className="pub-lead">{heroSubtitle}</p>
          <a href="#listings" className="primary-button pub-cta">
            Browse listings <ArrowRight size={16} />
          </a>
          {dbError && (
            <p className="pub-note">
              Live listings appear when DATABASE_URL is connected and this workspace exists.
            </p>
          )}
          {!dbError && !tenant && (
            <p className="pub-note">
              No workspace found for “{slug}”. Create one via onboarding after auth is live.
            </p>
          )}
        </div>
      </section>

      <section className="pub-section" id="listings">
        <div className="pub-section-inner">
          <div className="pub-section-head">
            <h2>Featured listings</h2>
            <p>{seoDescription}</p>
          </div>

          {properties.length === 0 ? (
            <div className="pub-empty">
              <Building2 size={28} />
              <strong>No published listings yet</strong>
              <span>
                When this agency publishes properties, they will show here automatically.
              </span>
            </div>
          ) : (
            <div className="pub-grid">
              {properties.map((p) => (
                <article key={p.id} className="pub-card">
                  <div className="pub-card-visual" />
                  <div className="pub-card-body">
                    <h3>{p.title}</h3>
                    <div className="pub-card-loc">
                      <MapPin size={13} />
                      {[p.city, p.state].filter(Boolean).join(", ") || "Nigeria"}
                    </div>
                    <div className="pub-card-price">
                      {formatMoney(p.price, p.currency)}
                      {p.price_period ? ` / ${p.price_period}` : ""}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pub-section pub-contact" id="contact">
        <div className="pub-section-inner pub-contact-inner">
          <h2>Enquire</h2>
          <p>
            Contact {name}
            {settings?.contact_email ? ` · ${settings.contact_email}` : ""}
            {settings?.contact_phone ? ` · ${settings.contact_phone}` : ""}
          </p>
          <p className="pub-note">
            Public enquiry forms will post into the tenant’s lead pipeline.
          </p>
        </div>
      </section>

      <footer className="pub-footer">
        <span>
          {name} · Public site on <Link href="/">RealtyOS</Link>
        </span>
      </footer>
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
