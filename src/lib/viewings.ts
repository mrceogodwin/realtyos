import { query, queryMany, queryOne } from "./db";
import type { PropertyViewing, ViewingStatus } from "./types";
import type { CreateViewingInput } from "./validation";

export type ViewingListOptions = {
  tenantId: string;
  status?: ViewingStatus | ViewingStatus[];
  agentId?: string;
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export async function listViewings(
  options: ViewingListOptions
): Promise<PropertyViewing[]> {
  const {
    tenantId,
    status,
    agentId,
    propertyId,
    limit = 50,
    offset = 0,
  } = options;

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

  if (agentId) {
    where += ` AND agent_id = $${idx}`;
    params.push(agentId);
    idx++;
  }

  if (propertyId) {
    where += ` AND property_id = $${idx}`;
    params.push(propertyId);
    idx++;
  }

  params.push(limit, offset);

  return queryMany<PropertyViewing>(
    `SELECT * FROM property_viewings
     WHERE ${where}
     ORDER BY scheduled_at ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );
}

export async function getViewingById(
  tenantId: string,
  viewingId: string
): Promise<PropertyViewing | null> {
  return queryOne<PropertyViewing>(
    `SELECT * FROM property_viewings WHERE id = $1 AND tenant_id = $2`,
    [viewingId, tenantId]
  );
}

export async function createViewing(
  tenantId: string,
  input: CreateViewingInput,
  createdBy?: string | null
): Promise<PropertyViewing> {
  const result = await query<PropertyViewing>(
    `INSERT INTO property_viewings (
      tenant_id, property_id, lead_id, agent_id,
      visitor_name, visitor_email, visitor_phone,
      scheduled_at, duration_minutes, notes, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      tenantId,
      input.property_id,
      input.lead_id ?? null,
      input.agent_id ?? null,
      input.visitor_name,
      input.visitor_email ?? null,
      input.visitor_phone ?? null,
      input.scheduled_at,
      input.duration_minutes ?? 60,
      input.notes ?? null,
      createdBy ?? null,
    ]
  );
  return result.rows[0];
}

export async function updateViewingStatus(
  tenantId: string,
  viewingId: string,
  status: ViewingStatus
): Promise<PropertyViewing | null> {
  return queryOne<PropertyViewing>(
    `UPDATE property_viewings
     SET status = $1, updated_at = now()
     WHERE id = $2 AND tenant_id = $3
     RETURNING *`,
    [status, viewingId, tenantId]
  );
}
