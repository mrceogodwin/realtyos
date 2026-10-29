import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property inventory",
    body: "Create, publish and manage listings with media, status and agent assignment — scoped to your workspace only.",
  },
  {
    icon: Users,
    title: "CRM & leads",
    body: "Capture enquiries from your public site, assign agents, track stages and never lose a follow-up.",
  },
  {
    icon: CalendarDays,
    title: "Viewings",
    body: "Schedule, confirm and complete property viewings with a clear calendar for your team.",
  },
  {
    icon: Compass,
    title: "Branded websites",
    body: "Each agency gets its own public site with logo, colours, SEO and property search — on a subdomain or custom domain.",
  },
  {
    icon: LayoutDashboard,
    title: "Business dashboard",
    body: "Live metrics for listings, leads, viewings and portfolio value. No invented numbers.",
  },
  {
    icon: ShieldCheck,
    title: "True multi-tenancy",
    body: "Every company is isolated. Permissions are enforced on the server. Your data stays yours.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Coming soon",
    blurb: "Independent agents getting organised.",
    points: ["Active listings", "Lead capture", "1 workspace", "Subdomain site"],
  },
  {
    name: "Professional",
    price: "Coming soon",
    blurb: "Growing agencies with a small team.",
    points: ["Team seats", "Viewings calendar", "Branding controls", "Reports"],
    highlight: true,
  },
  {
    name: "Business",
    price: "Coming soon",
    blurb: "Larger operations and developers.",
    points: ["Custom domains", "Advanced roles", "Audit log", "Priority support"],
  },
];

export default function MarketingHomePage() {
  return (
    <div className="marketing">
      <header className="m-nav">
        <div className="m-nav-inner">
          <Link href="/" className="m-brand">
            <div className="brand-mark">
              <Building2 size={20} strokeWidth={2.1} />
            </div>
            <span className="brand-name">
              realty<span>OS</span>
            </span>
          </Link>
          <nav className="m-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Sign in</Link>
            <Link href="/onboarding" className="primary-button m-cta">
              Get started <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="m-hero">
        <div className="m-hero-inner">
          <p className="m-eyebrow">Built for Nigerian real estate · Expanding globally</p>
          <h1>
            One platform.
            <br />
            Every real-estate business.
          </h1>
          <p className="m-lead">
            RealtyOS is the operating system for agencies, independent agents and
            developers. Manage listings, leads, viewings and a branded public website
            from one secure workspace.
          </p>
          <div className="m-hero-actions">
            <Link href="/onboarding" className="primary-button m-hero-btn">
              Start your workspace <ArrowRight size={16} />
            </Link>
            <Link href="/app" className="secondary-button m-hero-btn-secondary">
              View dashboard demo
            </Link>
          </div>
          <p className="m-trust">
            Multi-tenant by design · Naira-first · Server-side authorization
          </p>
        </div>
      </section>

      <section className="m-section" id="features">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>Everything a modern agency needs</h2>
            <p>
              Not a single-company website. A complete SaaS for many companies,
              each with its own brand, data and team.
            </p>
          </div>
          <div className="m-feature-grid">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="m-feature">
                <div className="m-feature-icon">
                  <Icon size={18} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section m-section-alt" id="pricing">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>Simple plans when you are ready</h2>
            <p>
              Pricing will be configurable from the super-admin console. No invented
              numbers here — plans go live when billing is verified.
            </p>
          </div>
          <div className="m-pricing-grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={"m-plan" + (plan.highlight ? " m-plan-highlight" : "")}
              >
                <h3>{plan.name}</h3>
                <div className="m-plan-price">{plan.price}</div>
                <p className="m-plan-blurb">{plan.blurb}</p>
                <ul>
                  {plan.points.map((p) => (
                    <li key={p}>
                      <Check size={14} /> {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="m-cta-band">
        <div className="m-section-inner m-cta-inner">
          <h2>Ready to run your agency on RealtyOS?</h2>
          <p>Create a workspace, invite your team, and publish your first listing.</p>
          <Link href="/onboarding" className="primary-button m-hero-btn">
            Create workspace <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="m-footer">
        <div className="m-section-inner m-footer-inner">
          <div className="m-brand">
            <div className="brand-mark">
              <Building2 size={18} strokeWidth={2.1} />
            </div>
            <span className="brand-name">
              realty<span>OS</span>
            </span>
          </div>
          <p>Real estate, under control.</p>
          <div className="m-footer-links">
            <Link href="/login">Sign in</Link>
            <Link href="/app">Dashboard</Link>
            <Link href="/api/health">System status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
