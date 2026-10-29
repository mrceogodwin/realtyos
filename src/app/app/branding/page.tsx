"use client";

import { useState } from "react";
import { CheckCircle2, Globe2, Palette, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function BrandingPage() {
  const [notice, setNotice] = useState("");
  const [primary, setPrimary] = useState("#12634b");
  const [accent, setAccent] = useState("#c6a36b");
  const [heroTitle, setHeroTitle] = useState("Find your next home with confidence");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Premium properties across Lagos, Abuja and beyond — curated by GBest Luxury Realty."
  );
  const [seoTitle, setSeoTitle] = useState("GBest Luxury Realty");
  const [seoDescription, setSeoDescription] = useState(
    "Luxury homes, apartments and investments across Nigeria."
  );
  const [domain, setDomain] = useState("");

  return (
    <AppShell
      title="Website & brand"
      subtitle="Control how your public site looks. Changes stay scoped to this workspace only."
      actions={
        <button
          className="primary-button"
          onClick={() =>
            setNotice(
              "Branding save is ready in the tenants repository. Connect DATABASE_URL to persist."
            )
          }
        >
          Save changes
        </button>
      }
    >
      {notice && (
        <div className="notice-banner">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="brand-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Palette size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                Brand identity
              </h2>
              <p>Colours used on your public website and workspace accents.</p>
            </div>
          </div>
          <div className="brand-form">
            <label>
              Primary colour
              <div className="color-row">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                />
                <input
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </label>
            <label>
              Accent colour
              <div className="color-row">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
                <input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </label>
            <div className="brand-swatches">
              <div className="swatch" style={{ background: primary }}>
                Primary
              </div>
              <div className="swatch" style={{ background: accent, color: "#3a2e18" }}>
                Accent
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Hero content</h2>
              <p>Shown on your public homepage.</p>
            </div>
          </div>
          <div className="brand-form">
            <label>
              Hero title
              <input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
              />
            </label>
            <label>
              Hero subtitle
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>SEO</h2>
              <p>Default metadata for public pages.</p>
            </div>
          </div>
          <div className="brand-form">
            <label>
              SEO title
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </label>
            <label>
              SEO description
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Globe2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                Domain
              </h2>
              <p>Subdomain first; custom domain after verification.</p>
            </div>
          </div>
          <div className="brand-form">
            <label>
              Workspace subdomain
              <div className="slug-field">
                <span>realtyos.app/</span>
                <input value="gbest-luxury" readOnly />
              </div>
            </label>
            <label>
              Custom domain
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="www.youragency.com"
              />
            </label>
            <p className="field-hint">
              Domain verification and SSL will use Vercel domain APIs when activated.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
