"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Compass,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  ArrowUpRight,
} from "lucide-react";

const workspaceNav = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Properties", href: "/app/properties", icon: Building2 },
  { label: "Leads & clients", href: "/app/leads", icon: Users },
  { label: "Viewings", href: "/app/viewings", icon: CalendarDays },
  { label: "Messages", href: "/app/messages", icon: MessageSquare, soon: true },
];

const manageNav = [
  { label: "Website & brand", href: "/app/branding", icon: Compass },
  { label: "Team members", href: "/app/team", icon: ShieldCheck },
  { label: "Reports", href: "/app/reports", icon: FileText },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <main className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={"sidebar " + (mobileMenu ? "sidebar-open" : "")}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Building2 size={21} strokeWidth={2.1} />
          </div>
          <div>
            <div className="brand-name">
              realty<span>OS</span>
            </div>
            <div className="brand-caption">REAL ESTATE, UNDER CONTROL</div>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button className="workspace-switcher">
          <div className="workspace-avatar">G</div>
          <div className="workspace-copy">
            <strong>GBest Luxury Realty</strong>
            <span>Demo workspace</span>
          </div>
          <ChevronDown size={16} className="muted-icon" />
        </button>

        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          {workspaceNav.map(({ label, href, icon: Icon, soon }) => (
            <Link
              key={href}
              href={soon ? "#" : href}
              onClick={(e) => {
                if (soon) e.preventDefault();
                setMobileMenu(false);
              }}
              className={"nav-item " + (isActive(href) ? "nav-active" : "")}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {soon && <span className="nav-count">Soon</span>}
            </Link>
          ))}
        </nav>

        <div className="side-section-label management-label">MANAGE</div>
        <nav className="side-nav" aria-label="Management navigation">
          {manageNav.map(({ label, href, icon: Icon, soon }) => (
            <Link
              key={href}
              href={soon ? "#" : href}
              onClick={(e) => {
                if (soon) e.preventDefault();
                setMobileMenu(false);
              }}
              className={"nav-item " + (isActive(href) ? "nav-active" : "")}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {soon && <span className="nav-count">Soon</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="upgrade-card">
          <div className="upgrade-icon">
            <Sparkles size={17} />
          </div>
          <strong>Make it yours</strong>
          <p>Connect the database and auth to run on real workspace data.</p>
          <Link href="/">
            View product site <ArrowUpRight size={14} />
          </Link>
        </div>

        <Link href="/app" className="nav-item settings-link">
          <Settings size={18} />
          <span>Settings</span>
        </Link>

        <div className="profile-row">
          <div className="profile-avatar">GO</div>
          <div className="profile-copy">
            <strong>Godwin O.</strong>
            <span>Workspace owner</span>
          </div>
          <MoreHorizontal size={19} className="muted-icon" />
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              aria-label="Open menu"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span aria-hidden>/</span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="top-avatar">GO</div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> DEMO WORKSPACE
              </div>
              <h1>{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
