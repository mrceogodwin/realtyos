"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Globe2, Palette } from "lucide-react";
import { saveBrandingAction } from "@/app/actions/branding";

type Props = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  seoTitle: string;
  seoDescription: string;
  customDomain: string;
  published: boolean;
  workspaceSlug: string;
};

export function BrandingSettingsForm(props: Props) {
  const [primary, setPrimary] = useState(props.primaryColor);
  const [secondary, setSecondary] = useState(props.secondaryColor);
  const [accent, setAccent] = useState(props.accentColor);
  const [heroTitle, setHeroTitle] = useState(props.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(props.heroSubtitle);
  const [seoTitle, setSeoTitle] = useState(props.seoTitle);
  const [seoDescription, setSeoDescription] = useState(props.seoDescription);
  const [domain, setDomain] = useState(props.customDomain);
  const [published, setPublished] = useState(props.published);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await saveBrandingAction({
        primary_color: primary,
        secondary_color: secondary,
        accent_color: accent,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        seo_title: seoTitle,
        seo_description: seoDescription,
        custom_domain: domain.trim() || null,
        published,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Your workspace branding and SEO settings have been saved.");
    });
  }

  return (
    <>
      {notice && <div className="notice-banner"><CheckCircle2 size={17} /><span>{notice}</span></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="brand-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2><Palette size={16} /> Brand identity</h2><p>Colours used on your public website and workspace accents.</p></div></div>
          <div className="brand-form">
            <label>Primary colour<div className="color-row"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /><input value={primary} onChange={(e) => setPrimary(e.target.value)} /></div></label>
            <label>Secondary colour<div className="color-row"><input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /><input value={secondary} onChange={(e) => setSecondary(e.target.value)} /></div></label>
            <label>Accent colour<div className="color-row"><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} /><input value={accent} onChange={(e) => setAccent(e.target.value)} /></div></label>
            <div className="brand-swatches"><div className="swatch" style={{ background: primary }}>Primary</div><div className="swatch" style={{ background: secondary, color: "#222" }}>Secondary</div><div className="swatch" style={{ background: accent, color: "#3a2e18" }}>Accent</div></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Hero content</h2><p>Shown on your public homepage.</p></div></div>
          <div className="brand-form">
            <label>Hero title<input maxLength={200} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} /></label>
            <label>Hero subtitle<textarea rows={3} maxLength={500} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} /></label>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>SEO</h2><p>Default metadata for public pages.</p></div></div>
          <div className="brand-form">
            <label>SEO title<input maxLength={120} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></label>
            <label>SEO description<textarea rows={3} maxLength={300} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></label>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2><Globe2 size={16} /> Domain</h2><p>Workspace address and custom domain.</p></div></div>
          <div className="brand-form">
            <label>Workspace URL<div className="slug-field"><span>realtyos.app/s/</span><input value={props.workspaceSlug} readOnly /></div></label>
            <label>Custom domain<input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.youragency.com" /></label>
            <p className="field-hint">A custom domain is saved as pending configuration. DNS verification and domain activation are separate steps.</p>
            <label className="checkbox-label"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Publish public website</label>
            <p className="field-hint">When disabled, visitors cannot access this agency website or its property pages.</p>
          </div>
        </section>
      </div>
      <div className="panel-heading" style={{ justifyContent: "flex-end", marginTop: 20 }}>
        <button type="button" className="primary-button" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save changes"}</button>
      </div>
    </>
  );
}
