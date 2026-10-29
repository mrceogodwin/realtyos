"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createWorkspaceAction } from "@/app/actions/workspace";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function handleCompanyChange(value: string) {
    setCompanyName(value);
    if (!slug || slug === slugify(companyName)) {
      setSlug(slugify(value));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    const result = await createWorkspaceAction({
      name: companyName,
      slug,
      country: "NG",
      currency: "NGN",
      timezone: "Africa/Lagos",
    });

    setPending(false);

    if (result.ok) {
      setMessage(
        `Workspace "${result.data && typeof result.data === "object" && "name" in result.data ? (result.data as { name: string }).name : companyName}" is ready. Open /app to continue.`
      );
      return;
    }

    setError(result.error);
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
          This creates a tenant, default branding, settings, and your owner
          membership — once auth and the database are connected.
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

        <form className="auth-form" onSubmit={onSubmit}>
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
              <span>realtyos.app/s/</span>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="gbest-luxury"
              />
            </div>
          </label>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={pending}
          >
            {pending ? "Creating…" : "Continue setup"}
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
