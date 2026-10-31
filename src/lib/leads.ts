import { query, queryMany, queryOne } from "./db";
import type { Lead, LeadStatus } from "./types";
import type { CreateLeadInput } from "./validation";

export type LeadListOptions = {
  tenantId: string;
  status?: LeadStatus | LeadStatus[];
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listLeads(options: LeadListOptions): Promise<Lead[]> {
  const { tenantId, status, search, limit = 50, offset = 0 } = options;

  const params: unknown[] = [tenantId];
  let where = "tenant_id = $1";
  let idx = 2;

  if (status) {
    if (Array.isArray(status)) {
      where += ` AND status = ANY($${idx}::text[])`;
      params.push(status);
    } else {
      where += ` AND status = $${idx}`;
      params.push(status);
    }
    idx++;
  }

  if (search && search.trim()) {
    where += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    params.push(`%${search.trim()}%`);
    idx++;
  }

  params.push(limit, offset);

  return queryMany<Lead>(
    `SELECT * FROM leads
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );
}

export async function getLeadById(
  tenantId: string,
  leadId: string
): Promise<Lead | null> {
  return queryOne<Lead>(
    `SELECT * FROM leads WHERE id = $1 AND tenant_id = $2`,
    [leadId, tenantId]
  );
}

export async function createLead(
  tenantId: string,
  input: CreateLeadInput
): Promise<Lead> {
  if (input.property_id) {
    const property = await queryOne<{ id: string }>(
      "SELECT id FROM properties WHERE id = $1 AND tenant_id = $2",
      [input.property_id, tenantId]
    );
    if (!property) throw new Error("Property does not belong to this workspace");
  }

  const result = await query<Lead>(
    `INSERT INTO leads (
      tenant_id, property_id, full_name, email, phone, source,
      notes, budget_min, budget_max, preferred_location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      tenantId,
      input.property_id ?? null,
      input.full_name,
      input.email ?? null,
      input.phone ?? null,
      input.source ?? "website",
      input.notes ?? null,
      input.budget_min ?? null,
      input.budget_max ?? null,
      input.preferred_location ?? null,
    ]
  );
  return result.rows[0];
}

export async function updateLeadStatus(
  tenantId: string,
  leadId: string,
  status: LeadStatus,
  assignedAgentId?: string | null
): Promise<Lead | null> {
  if (assignedAgentId) {
    const membership = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'active'`,
      [tenantId, assignedAgentId]
    );
    if (!membership) throw new Error("Assigned agent is not an active member of this workspace");
  }

  return queryOne<Lead>(
    `UPDATE leads
     SET status = $1,
         assigned_agent_id = COALESCE($4, assigned_agent_id),
         updated_at = now()
     WHERE id = $2 AND tenant_id = $3
     RETURNING *`,
    [status, leadId, tenantId, assignedAgentId ?? null]
  );
}

export async function countLeadsByStatus(
  tenantId: string
): Promise<Record<string, number>> {
  const rows = await queryMany<{ status: string; count: string }>(
    `SELECT status, count(*)::text AS count
     FROM leads
     WHERE tenant_id = $1
     GROUP BY status`,
    [tenantId]
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = Number(row.count);
  }
  return result;
}

export async function updateLeadWorkflow(
  tenantId: string,
  leadId: string,
  input: { status: LeadStatus; assignedAgentId: string | null; followUpAt: string | null },
  actorId: string
): Promise<Lead | null> {
  return queryOne<Lead>(
    `UPDATE leads
        SET status = $1,
            assigned_agent_id = $2,
            follow_up_at = $3,
            updated_at = now()
      WHERE id = $4 AND tenant_id = $5
      RETURNING *`,
    [input.status, input.assignedAgentId, input.followUpAt, leadId, tenantId]
  );
}
