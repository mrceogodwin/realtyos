"use client";

import { signIn } from "next-auth/react";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Building2 size={22} strokeWidth={2.1} /></div>
          <div>
            <div className="brand-name">realty<span>OS</span></div>
            <div className="brand-caption">REAL ESTATE, UNDER CONTROL</div>
          </div>
        </div>
        <h1>Sign in to your workspace</h1>
        <p className="auth-subtitle">
          Secure access to your real estate business, team and listings.
        </p>
        {configured ? (
          <button
            type="button"
            className="primary-button auth-submit"
            onClick={() => signIn("google", { callbackUrl: "/app" })}
          >
            Continue with Google
          </button>
        ) : (
          <p className="form-error">
            Google sign-in is not configured. Add the OAuth credentials and
            authentication secret to your environment, then enable the sign-in button.
          </p>
        )}
        <p className="auth-footer">
          New to RealtyOS? <Link href="/onboarding">Create a workspace</Link>
        </p>
      </div>
    </main>
  );
}
