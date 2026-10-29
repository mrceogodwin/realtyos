"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const steps = [
  "Create your account",
  "Name your company",
  "Choose a workspace URL",
  "Add brand colours",
  "Invite your first agent (optional)",
];

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");

  function handleCompanyChange(value: string) {
    setCompanyName(value);
    if (!slug || slug === slugify(companyName)) {
      setSlug(slugify(value));
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card onboarding-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <Building2 size={22} strokeWidth={2.1} />
          </div>
          <div>
            <div className="brand-name">
              realty<span>OS</span>
            </div>
            <div className="brand-caption">REAL ESTATE, UNDER CONTROL</div>
          </div>
        </div>

        <h1>Set up your workspace</h1>
        <p className="auth-subtitle">
          Onboarding will create a tenant, branding, and your owner membership.
          Full account creation activates once authentication is live.
        </p>

        <ol className="onboarding-steps">
          {steps.map((step, i) => (
            <li key={step}>
              <CheckCircle2 size={16} />
              <span>
                <strong>Step {i + 1}.</strong> {step}
              </span>
            </li>
          ))}
        </ol>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            alert(
              "Workspace creation is ready in the data layer. Connect DATABASE_URL + Auth to activate it."
            );
          }}
        >
          <label>
            Company name
            <input
              required
              value={companyName}
              onChange={(e) => handleCompanyChange(e.target.value)}
              placeholder="e.g. GBest Luxury Realty"
            />
          </label>
          <label>
            Workspace URL
            <div className="slug-field">
              <span>realtyos.app/</span>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="gbest-luxury"
              />
            </div>
          </label>
          <button type="submit" className="primary-button auth-submit">
            Continue setup
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
