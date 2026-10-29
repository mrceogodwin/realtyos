"use client";

import { useState } from "react";
import {
  Activity, ArrowUpRight, Bell, Building2, CalendarDays,
  ChevronDown, ChevronRight, CircleHelp, Compass, FileText,
  LayoutDashboard, MapPin, Menu, MessageSquare, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, SlidersHorizontal, Sparkles, Users, X, Clock3,
  BedDouble, Bath, Square, TrendingUp, CheckCircle2
} from "lucide-react";

type Property = {
  name: string; location: string; price: string; status: string;
  beds: number; baths: number; area: string; tone: string; initials: string;
};

const properties: Property[] = [
  { name: "The Meridian Residence", location: "Lekki Phase 1, Lagos", price: "₦285,000,000", status: "Published", beds: 5, baths: 6, area: "620 sqm", tone: "villa", initials: "MR" },
  { name: "Palm Court Apartments", location: "Victoria Island, Lagos", price: "₦95,000,000", status: "Published", beds: 3, baths: 3, area: "180 sqm", tone: "apartments", initials: "PC" },
  { name: "Olive Crest Duplex", location: "GRA, Benin City", price: "₦165,000,000", status: "Draft", beds: 4, baths: 5, area: "410 sqm", tone: "duplex", initials: "OC" },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Properties", icon: Building2, count: "24" },
  { label: "Leads & clients", icon: Users, count: "18" },
  { label: "Viewings", icon: CalendarDays },
  { label: "Messages", icon: MessageSquare, count: "3" },
];
const management = [
  { label: "Website & brand", icon: Compass },
  { label: "Team members", icon: ShieldCheck },
  { label: "Reports", icon: FileText },
];

export default function AppDashboardPage() {
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNewProperty, setShowNewProperty] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = properties.filter((property) =>
    (property.name + " " + property.location).toLowerCase().includes(search.toLowerCase())
  );

  function choose(label: string) {
    setActive(label);
    setMobileMenu(false);
    if (label !== "Overview" && label !== "Properties") {
      setNotice(label + " workspace is next in the build sequence.");
    } else setNotice("");
  }

  return (
    <main className="app-shell">
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <aside className={"sidebar " + (mobileMenu ? "sidebar-open" : "")}>
        <div className="brand-lockup">
          <div className="brand-mark"><Building2 size={21} strokeWidth={2.1} /></div>
          <div><div className="brand-name">realty<span>OS</span></div><div className="brand-caption">REAL ESTATE, UNDER CONTROL</div></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileMenu(false)}><X size={18} /></button>
        </div>
        <button className="workspace-switcher">
          <div className="workspace-avatar">G</div>
          <div className="workspace-copy"><strong>GBest Luxury Realty</strong><span>Workspace</span></div>
          <ChevronDown size={16} className="muted-icon" />
        </button>
        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          {navigation.map(({ label, icon: Icon, count }) => (
            <button key={label} onClick={() => choose(label)} className={"nav-item " + (active === label ? "nav-active" : "")}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="side-section-label management-label">MANAGE</div>
        <nav className="side-nav" aria-label="Management navigation">
          {management.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => choose(label)} className={"nav-item " + (active === label ? "nav-active" : "")}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="upgrade-card">
          <div className="upgrade-icon"><Sparkles size={17} /></div>
          <strong>Make it yours</strong>
          <p>Bring your brand, listings and team into one place.</p>
          <button onClick={() => choose("Website & brand")}>Explore branding <ArrowUpRight size={14} /></button>
        </div>
        <button className="nav-item settings-link" onClick={() => choose("Settings")}><Settings size={18} /><span>Settings</span></button>
        <div className="profile-row">
          <div className="profile-avatar">GO</div><div className="profile-copy"><strong>Godwin O.</strong><span>Workspace owner</span></div><MoreHorizontal size={19} className="muted-icon" />
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
            <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{active}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={16} /><input aria-label="Search RealtyOS" placeholder="Search anything..." value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div>
            <button className="icon-button help-button" aria-label="Help" onClick={() => setNotice("Help centre is coming in a later build.")}><CircleHelp size={19} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You're all caught up on notifications.")}><Bell size={19} /><i /></button>
            <div className="top-avatar">GO</div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="live-dot" /> DEMO WORKSPACE</div><h1>{active === "Overview" ? "Good morning, Godwin" : active}</h1><p className="page-subtitle">{active === "Overview" ? "Demonstration data. Connect DATABASE_URL and auth to load your real workspace." : "Your workspace at a glance. More tools are being connected as RealtyOS grows."}</p></div>
            <button className="primary-button" onClick={() => setShowNewProperty(true)}><Plus size={17} /> Add property</button>
          </div>

          {notice && <div className="notice-banner"><CheckCircle2 size={17} /><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16} /></button></div>}

          <div className="metric-grid">
            <Metric title="Total properties" value="24" change="+4 this month" icon={<Building2 size={18} />} trend="up" note="Demo figures" />
            <Metric title="Active leads" value="18" change="+12.8%" icon={<Users size={18} />} trend="up" note="Demo figures" />
            <Metric title="Viewings booked" value="07" change="3 upcoming" icon={<CalendarDays size={18} />} trend="neutral" note="Demo figures" />
            <Metric title="Portfolio value" value="₦2.84B" change="+8.2%" icon={<TrendingUp size={18} />} trend="up" note="Demo figures" />
          </div>

          <div className="content-grid">
            <section className="panel property-panel">
              <div className="panel-heading"><div><h2>Recent properties</h2><p>Demonstration listings until live data is connected.</p></div><button className="text-button" onClick={() => choose("Properties")}>View all <ArrowUpRight size={15} /></button></div>
              <div className="property-toolbar"><div className="list-count">Showing <strong>{filtered.length}</strong> of 24 properties</div><button className="filter-button" onClick={() => setNotice("Filters: Published · Draft · Under offer · Sold")}><SlidersHorizontal size={15} /> Filters</button></div>
              <div className="property-list">
                {filtered.map((property) => <PropertyCard key={property.name} property={property} />)}
                {filtered.length === 0 && <div className="empty-state"><Search size={22} /><strong>No properties found</strong><span>Try another name or location.</span></div>}
              </div>
              <button className="panel-footer-link" onClick={() => choose("Properties")}>Open property manager <ArrowUpRight size={15} /></button>
            </section>

            <div className="right-column">
              <section className="panel activity-panel">
                <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your team.</p></div><button className="icon-button small-icon" aria-label="More activity options" onClick={() => setNotice("Activity options will be available soon.")}><MoreHorizontal size={19} /></button></div>
                <div className="activity-list">
                  <ActivityItem initials="AK" color="sage" title="New lead received" detail="Amaka Kingsley · Meridian Residence" time="12 min ago" />
                  <ActivityItem initials="TO" color="sand" title="Property status updated" detail="Tunde O. · Palm Court Apartments" time="48 min ago" />
                  <ActivityItem initials="GO" color="forest" title="New property added" detail="You · Olive Crest Duplex" time="2 hours ago" />
                  <ActivityItem initials="EO" color="rose" title="Viewing confirmed" detail="Efe O. · The Meridian Residence" time="Yesterday" />
                </div>
                <button className="panel-footer-link" onClick={() => setNotice("You're viewing the latest workspace activity.")}>View activity log <ArrowUpRight size={15} /></button>
              </section>
              <section className="panel viewings-panel">
                <div className="panel-heading"><div><h2>Upcoming viewings</h2><p>Your next appointments.</p></div><button className="icon-button small-icon" aria-label="View calendar" onClick={() => choose("Viewings")}><CalendarDays size={17} /></button></div>
                <div className="viewing-date"><div className="date-tile"><span>OCT</span><strong>30</strong></div><div className="viewing-copy"><strong>Meridian Residence</strong><span><Clock3 size={13} /> Tomorrow, 10:30 AM</span><span><MapPin size={13} /> Lekki Phase 1, Lagos</span></div></div>
                <div className="viewing-date"><div className="date-tile"><span>OCT</span><strong>31</strong></div><div className="viewing-copy"><strong>Palm Court Apartments</strong><span><Clock3 size={13} /> Saturday, 12:00 PM</span><span><MapPin size={13} /> Victoria Island, Lagos</span></div></div>
                <button className="panel-footer-link" onClick={() => choose("Viewings")}>Open viewing calendar <ArrowUpRight size={15} /></button>
              </section>
            </div>
          </div>

          <div className="bottom-strip"><div className="secure-badge"><ShieldCheck size={15} /><span>Workspace protected</span></div><span>RealtyOS <b>·</b> Your business, beautifully organised.</span><button onClick={() => setNotice("System status endpoint: /api/health")}><Activity size={14} /> System status</button></div>
        </div>
      </section>

      {showNewProperty && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNewProperty(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="modal-eyebrow">PROPERTY MANAGER</span><h2 id="modal-title">Add a property</h2><p>Start a new listing in your workspace.</p></div><button className="icon-button" aria-label="Close dialog" onClick={() => setShowNewProperty(false)}><X size={18} /></button></div><form onSubmit={(e) => { e.preventDefault(); setShowNewProperty(false); setNotice("Property form captured in this UI prototype. Database saving will be connected next."); }}><label>Property name<input required placeholder="e.g. The Meridian Residence" /></label><div className="form-two"><label>Listing type<select defaultValue="sale"><option value="sale">For sale</option><option value="rent">For rent</option><option value="short_let">Short let</option></select></label><label>Property type<select defaultValue="house"><option value="house">House / duplex</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option></select></label></div><label>Location<input required placeholder="Area, city, state" /></label><label>Asking price (₦)<input required type="number" min="0" placeholder="e.g. 285000000" /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowNewProperty(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Create listing</button></div></form></section></div>}
    </main>
  );
}

function Metric({ title, value, change, icon, trend, note }: { title: string; value: string; change: string; icon: React.ReactNode; trend: "up" | "neutral"; note: string }) {
  return <section className="metric-card"><div className="metric-top"><span>{title}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={"metric-change " + (trend === "up" ? "positive" : "")}>{trend === "up" ? <ArrowUpRight size={14} /> : <CalendarDays size={13} />}{change}</span><span className="metric-note">{note}</span></div></section>;
}

function PropertyCard({ property }: { property: Property }) {
  return <article className="property-row"><div className={"property-visual " + property.tone}><div className="visual-sun" /><div className="visual-building"><span /><span /><span /></div><div className="visual-initials">{property.initials}</div></div><div className="property-main"><div className="property-title-line"><h3>{property.name}</h3><span className={"status-pill " + (property.status === "Draft" ? "status-draft" : "")}><i />{property.status}</span></div><div className="property-location"><MapPin size={13} />{property.location}</div><div className="property-specs"><span><BedDouble size={14} />{property.beds} beds</span><span><Bath size={14} />{property.baths} baths</span><span><Square size={13} />{property.area}</span></div><div className="property-price">{property.price}</div></div><button className="icon-button property-more" aria-label={"More options for " + property.name}><MoreHorizontal size={18} /></button></article>;
}

function ActivityItem({ initials, color, title, detail, time }: { initials: string; color: string; title: string; detail: string; time: string }) {
  return <div className="activity-item"><div className={"activity-avatar " + color}>{initials}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span><small>{time}</small></div></div>;
}
