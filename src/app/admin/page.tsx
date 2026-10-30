import { redirect } from "next/navigation";
import { getCurrentAuthContext, requireSuperAdmin } from "@/lib/auth";
import { queryOne, queryMany } from "@/lib/db";

type Overview = { tenants: string; active_tenants: string; users: string; subscriptions: string };
type TenantItem = { id: string; name: string; slug: string; status: string; created_at: string };

export default async function PlatformAdminPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  try {
    requireSuperAdmin(context);
  } catch {
    redirect("/app");
  }

  const overview = await queryOne<Overview>(
    `SELECT
      (SELECT count(*)::text FROM tenants WHERE deleted_at IS NULL) AS tenants,
      (SELECT count(*)::text FROM tenants WHERE status = 'active' AND deleted_at IS NULL) AS active_tenants,
      (SELECT count(*)::text FROM user_profiles WHERE status = 'active') AS users,
      (SELECT count(*)::text FROM subscriptions WHERE status IN ('trialing', 'active')) AS subscriptions`
  );
  const tenants = await queryMany<TenantItem>(
    `SELECT id, name, slug, status, created_at
       FROM tenants WHERE deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 25`
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7f5", color: "#17251f", padding: "36px 5vw" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 30 }}>
        <div>
          <p style={{ color: "#267052", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>REALTYOS PLATFORM</p>
          <h1 style={{ fontSize: 32, margin: "8px 0" }}>Super admin</h1>
          <p style={{ color: "#64736b" }}>Manage and monitor all RealtyOS workspaces.</p>
        </div>
        <a href="/app" style={{ color: "#176448", fontWeight: 700 }}>Open workspace →</a>
      </header>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        <Stat label="Total workspaces" value={overview?.tenants ?? "0"} />
        <Stat label="Active workspaces" value={overview?.active_tenants ?? "0"} />
        <Stat label="Active accounts" value={overview?.users ?? "0"} />
        <Stat label="Trial / paid subscriptions" value={overview?.subscriptions ?? "0"} />
      </section>
      <section style={{ background: "#fff", border: "1px solid #e4eae5", borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: "0 0 18px" }}>Recent workspaces</h2>
        {tenants.length === 0 ? <p style={{ color: "#64736b" }}>No workspaces found.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr><th style={cell}>Company</th><th style={cell}>Public slug</th><th style={cell}>Status</th><th style={cell}>Created</th></tr></thead>
              <tbody>{tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td style={cell}>{tenant.name}</td>
                  <td style={cell}>/s/{tenant.slug}</td>
                  <td style={cell}>{tenant.status}</td>
                  <td style={cell}>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(tenant.created_at))}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <article style={{ background: "#fff", border: "1px solid #e4eae5", borderRadius: 16, padding: 22 }}>
    <p style={{ color: "#64736b", margin: 0 }}>{label}</p>
    <strong style={{ display: "block", fontSize: 32, marginTop: 12 }}>{value}</strong>
  </article>;
}

const cell = { padding: "13px 10px", borderBottom: "1px solid #edf1ed", fontSize: 14 };
