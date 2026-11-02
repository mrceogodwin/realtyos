import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Building2 } from "lucide-react";
import { getCurrentAuthContext, requireSuperAdmin } from "@/lib/auth";
import { queryMany } from "@/lib/db";

type Agency = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_key: string;
  contact_email: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminAgenciesPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  try { requireSuperAdmin(context); } catch { redirect("/app"); }

  const agencies = await queryMany<Agency>(
    `SELECT id, name, slug, status, plan_key, contact_email, created_at
       FROM tenants
      ORDER BY created_at DESC
      LIMIT 100`
  );

  const active = agencies.filter((agency) => agency.status === "active").length;
  const pending = agencies.filter((agency) => agency.status === "pending").length;
  const suspended = agencies.filter((agency) => agency.status === "suspended").length;

  return (
    <main className="platform-admin admin-directory">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin"><span className="brand-symbol">⌂</span><span><b>Realty<span>OS</span></b><small>PLATFORM CONTROL</small></span></Link>
        <div className="platform-chip"><span className="chip-icon">R</span><span><b>RealtyOS Platform</b><small>Super administrator</small></span></div>
        <div className="nav-caption">PLATFORM</div>
        <nav className="admin-nav">
          <Link href="/admin"><i>▦</i>Overview</Link>
          <Link className="selected" href="/admin/agencies"><i>⌂</i>Agencies & Workspaces</Link>
        </nav>
        <div className="sidebar-bottom"><div className="secure-note"><b>◈ &nbsp; Platform protected</b><small>Administrator access only</small></div><Link className="workspace-link" href="/app">↗ &nbsp; Open company workspace</Link></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div><Link className="admin-back" href="/admin"><ArrowLeft size={14}/> Overview</Link><span className="muted"> / </span><b>Agencies & Workspaces</b></div><span className="live-data">● Live platform data</span></header>
        <div className="admin-content">
          <div className="welcome"><div><div className="overline">● PLATFORM DIRECTORY</div><h1>Agencies & Workspaces</h1><p>Review the companies registered on RealtyOS.</p></div><span className="live-data">{agencies.length} latest records · up to 100</span></div>
          <div className="stat-grid">
            <article className="stat-card"><div className="stat-head"><span>Workspaces loaded</span><i>⌂</i></div><strong>{agencies.length}</strong><small>Most recently created</small></article>
            <article className="stat-card"><div className="stat-head"><span>Active</span><i>✓</i></div><strong>{active}</strong><small>Currently active</small></article>
            <article className="stat-card"><div className="stat-head"><span>Pending</span><i>◷</i></div><strong>{pending}</strong><small>Awaiting activation</small></article>
            <article className="stat-card"><div className="stat-head"><span>Suspended</span><i>⊘</i></div><strong>{suspended}</strong><small>Access suspended</small></article>
          </div>
          <section className="panel">
            <div className="panel-head"><div><h2>Workspace directory</h2><p>Tenant records from the platform database. This view is read-only.</p></div><span className="db-label">● NEON DATABASE</span></div>
            {agencies.length ? <div className="table-wrap"><table><thead><tr><th>AGENCY</th><th>CONTACT</th><th>PLAN</th><th>STATUS</th><th>JOINED</th><th>PUBLIC SITE</th></tr></thead><tbody>
              {agencies.map((agency) => <tr key={agency.id}>
                <td><span className="agency-avatar">{agency.name.slice(0,1).toUpperCase()}</span><b>{agency.name}</b></td>
                <td className="muted">{agency.contact_email || "—"}</td>
                <td className="muted">{agency.plan_key}</td>
                <td><span className={agency.status === "active" ? "status-active" : "status-other"}>{agency.status}</span></td>
                <td className="muted">{new Intl.DateTimeFormat("en-NG",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(agency.created_at))}</td>
                <td><Link className="admin-site-link" href={`/s/${agency.slug}`} target="_blank"><ExternalLink size={12}/> Open site</Link></td>
              </tr>)}
            </tbody></table></div> : <div className="empty"><Building2 size={24}/><b>No agencies registered yet</b><small>New agency workspaces will appear here after registration.</small></div>}
            <div className="panel-foot"><span>Showing {agencies.length} most recent workspace records</span><Link href="/admin">Back to overview ↗</Link></div>
          </section>
          <footer className="admin-footer"><span>© {new Date().getFullYear()} RealtyOS · Platform administration</span><span>Read-only directory <b>●</b></span></footer>
        </div>
      </section>
      <style>{`
        .admin-directory .admin-sidebar{position:sticky;top:0;height:100vh}
        .admin-directory .admin-nav a{text-decoration:none}
        .admin-directory .admin-back{display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;margin-right:8px}
        .admin-directory .admin-site-link{display:inline-flex;align-items:center;gap:5px;color:var(--lime);text-decoration:none;font-size:10px}
        .admin-directory .admin-site-link:hover,.admin-directory .admin-back:hover{opacity:.8}
        @media(max-width:900px){.admin-directory .admin-sidebar{display:none}.admin-directory .admin-content{padding:20px 14px}.admin-directory .admin-topbar{padding:0 14px}}
      `}</style>
    </main>
  );
}
