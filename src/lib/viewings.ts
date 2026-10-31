import { query, queryMany, queryOne, withTransaction } from "./db";
import type { PoolClient } from "pg";
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
     ORDER BY CASE WHEN scheduled_at >= now() THEN 0 ELSE 1 END,\n              CASE WHEN scheduled_at >= now() THEN scheduled_at END ASC,\n              CASE WHEN scheduled_at < now() THEN scheduled_at END DESC
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

async function enqueueViewingReminders(client: PoolClient, tenantId: string, viewing: PropertyViewing): Promise<void> {
  // Only store actual recipients. A visitor and the assigned agent can each receive
  // both reminder windows; the unique key makes retries safe.
  await client.query(
    `INSERT INTO viewing_reminder_deliveries (
       tenant_id, viewing_id, recipient_email, recipient_name,
       reminder_type, scheduled_for, next_attempt_at
     )
     SELECT $1, $2, recipients.email, recipients.name, reminder.type,
            GREATEST($3::timestamptz - reminder.lead_time, now()),
            GREATEST($3::timestamptz - reminder.lead_time, now())
       FROM (
         SELECT NULLIF(trim($4::text), '') AS email, NULLIF(trim($5::text), '') AS name
         UNION
         SELECT NULLIF(trim(u.email), ''), NULLIF(trim(u.full_name), '')
           FROM user_profiles u WHERE u.id = $6::uuid
       ) recipients
       CROSS JOIN (VALUES ('24h', interval '24 hours'), ('1h', interval '1 hour')) reminder(type, lead_time)
      WHERE recipients.email IS NOT NULL
     ON CONFLICT (viewing_id, recipient_email, reminder_type, scheduled_for) DO NOTHING`,
    [tenantId, viewing.id, viewing.scheduled_at, viewing.visitor_email, viewing.visitor_name, viewing.agent_id]
  );
}

export async function createViewing(
  tenantId: string,
  input: CreateViewingInput,
  createdBy?: string | null
): Promise<PropertyViewing> {
  return withTransaction(async (client) => {
    // Serialize workspace appointment writes before checking overlaps.
    await client.query("SELECT id FROM tenants WHERE id = $1 FOR UPDATE", [tenantId]);
    const property = await client.query("SELECT id FROM properties WHERE id = $1 AND tenant_id = $2", [input.property_id, tenantId]);
    if (!property.rowCount) throw new Error("Property does not belong to this workspace");
    if (input.lead_id) {
      const lead = await client.query("SELECT id FROM leads WHERE id = $1 AND tenant_id = $2", [input.lead_id, tenantId]);
      if (!lead.rowCount) throw new Error("Lead does not belong to this workspace");
    }
    if (input.agent_id) {
      const membership = await client.query(
        "SELECT user_id FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' AND role IN ('agent', 'admin', 'owner')",
        [tenantId, input.agent_id]
      );
      if (!membership.rowCount) throw new Error("Assigned agent is not an active member of this workspace");
    }
    const duration = input.duration_minutes ?? 60;
    const conflict = await client.query(
      `SELECT id FROM property_viewings
        WHERE tenant_id = $1 AND status NOT IN ('cancelled', 'completed', 'no_show')
          AND (property_id = $2 OR ($3::uuid IS NOT NULL AND agent_id = $3))
          AND scheduled_at < ($4::timestamptz + ($5::int * interval '1 minute'))
          AND (scheduled_at + (duration_minutes * interval '1 minute')) > $4::timestamptz
        LIMIT 1`,
      [tenantId, input.property_id, input.agent_id ?? null, input.scheduled_at, duration]
    );
    if (conflict.rowCount) throw new ViewingConflictError();
    const result = await client.query<PropertyViewing>(
      `INSERT INTO property_viewings (
        tenant_id, property_id, lead_id, agent_id,
        visitor_name, visitor_email, visitor_phone,
        scheduled_at, duration_minutes, notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, input.property_id, input.lead_id ?? null, input.agent_id ?? null,
       input.visitor_name, input.visitor_email ?? null, input.visitor_phone ?? null,
       input.scheduled_at, duration, input.notes ?? null, createdBy ?? null]
    );
    const viewing = result.rows[0];
    await enqueueViewingReminders(client, tenantId, viewing);
    return viewing;
  });
}

export class ViewingStatusTransitionError extends Error {
  constructor(message = "That status change is not allowed for this appointment.") {
    super(message);
    this.name = "ViewingStatusTransitionError";
  }
}

const allowedViewingTransitions: Record<ViewingStatus, ViewingStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["rescheduled", "completed", "cancelled", "no_show"],
  rescheduled: ["confirmed", "completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function updateViewingStatus(
  tenantId: string,
  viewingId: string,
  status: ViewingStatus
): Promise<PropertyViewing | null> {
  return withTransaction(async (client) => {
    const currentResult = await client.query<PropertyViewing>(
      "SELECT * FROM property_viewings WHERE id = $1 AND tenant_id = $2 FOR UPDATE",
      [viewingId, tenantId]
    );
    const current = currentResult.rows[0];
    if (!current) return null;
    if (current.status === status) return current;
    if (!allowedViewingTransitions[current.status].includes(status)) {
      throw new ViewingStatusTransitionError();
    }
    if (["cancelled", "completed", "no_show"].includes(status)) {
      await client.query(
        `UPDATE viewing_reminder_deliveries
            SET status = 'cancelled', updated_at = now()
          WHERE tenant_id = $1 AND viewing_id = $2
            AND status IN ('pending', 'failed')`,
        [tenantId, viewingId]
      );
    }
    const updated = await client.query<PropertyViewing>(
      `UPDATE property_viewings SET status = $1, updated_at = now()
        WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, viewingId, tenantId]
    );
    return updated.rows[0] ?? null;
  });
}


export async function recordViewingActivity(tenantId: string, actorId: string, viewingId: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await query(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, entity_type, entity_id, metadata)
     SELECT $1, $2, $3, 'viewing', $4, $5::jsonb
      WHERE EXISTS (SELECT 1 FROM property_viewings WHERE id = $4 AND tenant_id = $1)`,
    [tenantId, actorId, action, viewingId, JSON.stringify(metadata)]
  );
}


export type ViewingActivity = {
  id: string;
  viewing_id: string;
  action: string;
  actor_name: string | null;
  actor_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listViewingActivities(tenantId: string, limit = 200): Promise<ViewingActivity[]> {
  return queryMany<ViewingActivity>(
    `SELECT a.id, a.entity_id AS viewing_id, a.action, a.metadata, a.created_at,
            u.full_name AS actor_name, u.email AS actor_email
       FROM audit_logs a LEFT JOIN user_profiles u ON u.id = a.actor_id
      WHERE a.tenant_id = $1 AND a.entity_type = 'viewing'
      ORDER BY a.created_at DESC LIMIT $2`,
    [tenantId, Math.min(Math.max(limit, 1), 500)]
  );
}


export class ViewingConflictError extends Error {
  constructor() { super("This time conflicts with another active viewing for the property or assigned agent."); this.name = "ViewingConflictError"; }
}

export async function rescheduleViewing(tenantId: string, viewingId: string, scheduledAt: string, durationMinutes: number): Promise<PropertyViewing | null> {
  return withTransaction(async (client) => {
    // Serialize scheduling changes within a workspace so simultaneous requests cannot pass the same conflict check.
    await client.query("SELECT id FROM tenants WHERE id = $1 FOR UPDATE", [tenantId]);
    const current = await client.query<PropertyViewing>("SELECT * FROM property_viewings WHERE id = $1 AND tenant_id = $2 FOR UPDATE", [viewingId, tenantId]);
    const viewing = current.rows[0];
    if (!viewing) return null;
    if (["cancelled", "completed", "no_show"].includes(viewing.status)) throw new Error("This viewing can no longer be rescheduled.");
    const conflict = await client.query(
      `SELECT id FROM property_viewings
        WHERE tenant_id = $1 AND id <> $2
          AND status NOT IN ('cancelled', 'completed', 'no_show')
          AND (property_id = $3 OR ($4::uuid IS NOT NULL AND agent_id = $4))
          AND scheduled_at < ($5::timestamptz + ($6::int * interval '1 minute'))
          AND (scheduled_at + (duration_minutes * interval '1 minute')) > $5::timestamptz
        LIMIT 1`,
      [tenantId, viewingId, viewing.property_id, viewing.agent_id, scheduledAt, durationMinutes]
    );
    if (conflict.rowCount) throw new ViewingConflictError();
    const updated = await client.query<PropertyViewing>(
      `UPDATE property_viewings SET scheduled_at = $1, duration_minutes = $2, status = 'rescheduled', updated_at = now()
        WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [scheduledAt, durationMinutes, viewingId, tenantId]
    );
    const rescheduled = updated.rows[0] ?? null;
    if (rescheduled) {
      await client.query(
        `UPDATE viewing_reminder_deliveries
            SET status = 'cancelled', updated_at = now()
          WHERE tenant_id = $1 AND viewing_id = $2
            AND status IN ('pending', 'failed')`,
        [tenantId, viewingId]
      );
      await enqueueViewingReminders(client, tenantId, rescheduled);
    }
    return rescheduled;
  });
}
