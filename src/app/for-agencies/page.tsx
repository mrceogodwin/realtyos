import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Compass,
  Globe2,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property inventory",
    body: "Draft, publish, archive and mark sold or rented. Multi-image galleries, cover selection, agent assignment and tenant-scoped search.",
  },
  {
    icon: Users,
    title: "CRM that follows through",
    body: "Enquiries become leads with stages, assignment, notes and follow-up dates. Built for Nigerian agency workflows.",
  },
  {
    icon: CalendarDays,
    title: "Viewing calendar",
    body: "Request, confirm, reschedule and complete viewings. Linked to properties, leads and agents.",
  },
  {
    icon: Compass,
    title: "Your brand, your website",
    body: "Logo, colours, hero copy, SEO and property search — on a RealtyOS subdomain first, custom domain when verified.",
  },
  {
    icon: LayoutDashboard,
    title: "Live business metrics",
    body: "Listings, leads, viewings and portfolio value from real data. Empty states when there is nothing to show.",
  },
  {
    icon: ShieldCheck,
    title: "Isolation by design",
    body: "Every company is a tenant. Roles are enforced on the server. Changing an ID in a request never opens another workspace.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your workspace",
    body: "Register, verify, name the company and choose a slug. You become the owner with full control.",
  },
  {
    n: "02",
    title: "Brand and publish",
    body: "Upload your logo, set colours, add listings and go live on a professional public site.",
  },
  {
    n: "03",
    title: "Operate the business",
    body: "Capture leads, schedule viewings, manage the team and watch the numbers that matter.",
  },
];

const audiences = [
  {
    title: "Independent agents",
    body: "Professional presence without hiring a developer. Listings, enquiries and follow-ups in one place.",
  },
  {
    title: "Agencies & teams",
    body: "Roles, assignments, shared inventory and a single source of truth across the office.",
  },
  {
    title: "Developers & estates",
    body: "Portfolio visibility, enquiry routing and branded marketing pages for projects and units.",
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
            <a href="#product">Product</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Sign in</Link>
            <Link href="/onboarding" className="primary-button m-cta">
              Get started <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="m-hero m-hero-flagship">
        <div className="m-hero-grid">
          <div className="m-hero-copy">
            <div className="m-badge">
              <Sparkles size={13} />
              <span>Premium real-estate operating system</span>
            </div>
            <h1>
              One platform.
              <span className="m-hero-accent"> Every real-estate business.</span>
            </h1>
            <p className="m-lead">
              RealtyOS gives agencies, agents and developers a secure workspace for
              listings, leads, viewings and a branded public website — without building
              software from scratch.
            </p>
            <div className="m-hero-actions">
              <Link href="/onboarding" className="primary-button m-hero-btn">
                Start your workspace <ArrowRight size={16} />
              </Link>
              <Link href="/app" className="secondary-button m-hero-btn-secondary">
                Explore the dashboard
              </Link>
            </div>
            <div className="m-hero-meta">
              <span><Globe2 size={14} /> Nigeria-first · Global-ready</span>
              <span><ShieldCheck size={14} /> Multi-tenant isolation</span>
              <span><MapPin size={14} /> NGN & local workflows</span>
            </div>
          </div>

          <div className="m-preview" id="product" aria-hidden="true">
            <div className="m-preview-chrome">
              <span /><span /><span />
              <div className="m-preview-url">app.realtyos · workspace</div>
            </div>
            <div className="m-preview-body">
              <aside className="m-preview-side">
                <div className="m-preview-brand">realty<span>OS</span></div>
                <div className="m-preview-nav active">Overview</div>
                <div className="m-preview-nav">Properties</div>
                <div className="m-preview-nav">Leads</div>
                <div className="m-preview-nav">Viewings</div>
              </aside>
              <div className="m-preview-main">
                <div className="m-preview-top">
                  <strong>Good morning</strong>
                  <span className="m-preview-pill">Workspace live</span>
                </div>
                <div className="m-preview-metrics">
                  <div><small>Properties</small><b>—</b></div>
                  <div><small>Active leads</small><b>—</b></div>
                  <div><small>Viewings</small><b>—</b></div>
                </div>
                <div className="m-preview-cards">
                  <div className="m-preview-card">
                    <div className="m-preview-thumb villa" />
                    <div>
                      <strong>Meridian Residence</strong>
                      <span>Lekki Phase 1 · Published</span>
                    </div>
                  </div>
                  <div className="m-preview-card">
                    <div className="m-preview-thumb apartments" />
                    <div>
                      <strong>Palm Court</strong>
                      <span>Victoria Island · Published</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-section m-audiences">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>Built for how Nigerian real estate actually works</h2>
            <p>
              From a single agent in Port Harcourt to a multi-city agency — same platform,
              isolated workspaces, configurable branding.
            </p>
          </div>
          <div className="m-audience-grid">
            {audiences.map((a) => (
              <article key={a.title} className="m-audience">
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" id="features">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>The complete operating system</h2>
            <p>
              Website, inventory, CRM, calendar and team controls — designed as one product,
              not a pile of disconnected tools.
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

      <section className="m-section m-section-alt" id="how">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>From zero to live workspace</h2>
            <p>Onboarding is structured so you can publish with confidence.</p>
          </div>
          <div className="m-steps">
            {steps.map((s) => (
              <article key={s.n} className="m-step">
                <div className="m-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="m-section" id="pricing">
        <div className="m-section-inner">
          <div className="m-section-head">
            <h2>Plans when billing is ready</h2>
            <p>
              Plan limits will be controlled from the super-admin console. Prices appear only
              after payment integration is verified — never as decoration.
            </p>
          </div>
          <div className="m-pricing-grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={"m-plan" + (plan.highlight ? " m-plan-highlight" : "")}
              >
                {plan.highlight && <div className="m-plan-tag">Most complete</div>}
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
          <h2>Your agency deserves software that feels premium</h2>
          <p>
            Create a workspace, invite the team, publish the first listing — and keep every
            lead in one place.
          </p>
          <Link href="/onboarding" className="primary-button m-hero-btn m-cta-light">
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
