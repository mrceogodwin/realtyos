"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
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

        <h1>Sign in to your workspace</h1>
        <p className="auth-subtitle">
          Authentication is being connected. Once AUTH_SECRET and the database
          are configured, email and password sign-in will work here.
        </p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            alert(
              "Auth providers are not live yet. Configure AUTH_SECRET + DATABASE_URL and finish the Auth.js setup."
            );
          }}
        >
          <label>
            Email
            <input type="email" required placeholder="you@agency.com" />
          </label>
          <label>
            Password
            <input type="password" required placeholder="••••••••" />
          </label>
          <button type="submit" className="primary-button auth-submit">
            Sign in
          </button>
        </form>

        <p className="auth-footer">
          New to RealtyOS?{" "}
          <Link href="/onboarding">Create a workspace</Link>
        </p>
      </div>
    </main>
  );
}
