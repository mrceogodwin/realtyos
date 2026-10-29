import { countPropertiesByStatus } from "./properties";
import { countLeadsByStatus } from "./leads";
import { queryOne } from "./db";

export type DashboardMetrics = {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  activeLeads: number;
  newLeads: number;
  upcomingViewings: number;
  portfolioValue: number;
};

/**
 * Real metrics for a tenant. Returns zeros when the database is empty.
 * Never fabricates numbers.
 */
export async function getDashboardMetrics(
  tenantId: string
): Promise<DashboardMetrics> {
  const [propertyCounts, leadCounts, portfolio, upcoming] = await Promise.all([
    countPropertiesByStatus(tenantId),
    countLeadsByStatus(tenantId),
    queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(price), 0)::text AS total
       FROM properties
       WHERE tenant_id = $1 AND status = 'published'`,
      [tenantId]
    ),
    queryOne<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM property_viewings
       WHERE tenant_id = $1
         AND status IN ('requested', 'confirmed')
         AND scheduled_at >= now()`,
      [tenantId]
    ),
  ]);

  const activeLeadStatuses = [
    "new",
    "contacted",
    "qualified",
    "viewing_scheduled",
    "negotiating",
  ];

  const activeLeads = activeLeadStatuses.reduce(
    (sum, s) => sum + (leadCounts[s] ?? 0),
    0
  );

  return {
    totalProperties: Object.values(propertyCounts).reduce((a, b) => a + b, 0),
    publishedProperties: propertyCounts["published"] ?? 0,
    draftProperties: propertyCounts["draft"] ?? 0,
    activeLeads,
    newLeads: leadCounts["new"] ?? 0,
    upcomingViewings: Number(upcoming?.count ?? 0),
    portfolioValue: Number(portfolio?.total ?? 0),
  };
}
