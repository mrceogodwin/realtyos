import { query, queryMany, queryOne } from "./db";
import type { Property, PropertyStatus } from "./types";
import type { CreatePropertyInput } from "./validation";

export type PropertyListOptions = {
  tenantId: string;
  status?: PropertyStatus | PropertyStatus[];
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listProperties(options: PropertyListOptions): Promise<Property[]> {
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
    where += ` AND (title ILIKE $${idx} OR city ILIKE $${idx} OR address ILIKE $${idx})`;
    params.push(`%${search.trim()}%`);
    idx++;
  }

  params.push(limit, offset);

  return queryMany<Property>(
    `SELECT * FROM properties
     WHERE ${where}
     ORDER BY updated_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );
}

export async function listPublishedProperties(
  tenantId: string,
  limit = 12
): Promise<Property[]> {
  return listProperties({
    tenantId,
    status: "published",
    limit,
  });
}

export async function getPropertyById(
  tenantId: string,
  propertyId: string
): Promise<Property | null> {
  return queryOne<Property>(
    `SELECT * FROM properties WHERE id = $1 AND tenant_id = $2`,
    [propertyId, tenantId]
  );
}

export async function getPropertyBySlug(
  tenantId: string,
  slug: string
): Promise<Property | null> {
  return queryOne<Property>(
    `SELECT * FROM properties WHERE slug = $1 AND tenant_id = $2`,
    [slug, tenantId]
  );
}

export async function createProperty(
  tenantId: string,
  input: CreatePropertyInput,
  createdBy?: string | null
): Promise<Property> {
  if (input.assigned_agent_id) {
    const membership = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'active'`,
      [tenantId, input.assigned_agent_id]
    );
    if (!membership) throw new Error("Assigned agent is not an active member of this workspace");
  }

  const result = await query<Property>(
    `INSERT INTO properties (
      tenant_id, title, slug, description, listing_type, property_type_id,
      status, price, currency, price_period, bedrooms, bathrooms, toilets,
      parking_spaces, area_value, area_unit, address, city, state, country,
      features, assigned_agent_id, created_by, published_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19, $20,
      $21::jsonb, $22, $23,
      CASE WHEN $7 = 'published' THEN now() ELSE NULL END
    )
    RETURNING *`,
    [
      tenantId,
      input.title,
      input.slug,
      input.description ?? null,
      input.listing_type,
      input.property_type_id ?? null,
      input.status ?? "draft",
      input.price,
      input.currency ?? "NGN",
      input.price_period ?? null,
      input.bedrooms ?? null,
      input.bathrooms ?? null,
      input.toilets ?? null,
      input.parking_spaces ?? null,
      input.area_value ?? null,
      input.area_unit ?? null,
      input.address ?? null,
      input.city ?? null,
      input.state ?? null,
      input.country ?? "NG",
      JSON.stringify(input.features ?? []),
      input.assigned_agent_id ?? null,
      createdBy ?? null,
    ]
  );

  return result.rows[0];
}

export async function updatePropertyStatus(
  tenantId: string,
  propertyId: string,
  status: PropertyStatus
): Promise<Property | null> {
  return queryOne<Property>(
    `UPDATE properties
     SET status = $1,
         published_at = CASE
           WHEN $1 = 'published' AND published_at IS NULL THEN now()
           ELSE published_at
         END,
         updated_at = now()
     WHERE id = $2 AND tenant_id = $3
     RETURNING *`,
    [status, propertyId, tenantId]
  );
}

export async function countPropertiesByStatus(
  tenantId: string
): Promise<Record<string, number>> {
  const rows = await queryMany<{ status: string; count: string }>(
    `SELECT status, count(*)::text AS count
     FROM properties
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

export async function updateProperty(
  tenantId: string,
  propertyId: string,
  input: CreatePropertyInput
): Promise<Property | null> {
  if (input.assigned_agent_id) {
    const membership = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'active'`,
      [tenantId, input.assigned_agent_id]
    );
    if (!membership) throw new Error("Assigned agent is not an active member of this workspace");
  }

  return queryOne<Property>(
    `UPDATE properties SET
       title = $1, slug = $2, description = $3, listing_type = $4,
       property_type_id = $5, price = $6, currency = $7, price_period = $8,
       bedrooms = $9, bathrooms = $10, toilets = $11, parking_spaces = $12,
       area_value = $13, area_unit = $14, address = $15, city = $16,
       state = $17, country = $18, features = $19::jsonb,
       assigned_agent_id = $20, updated_at = now()
     WHERE id = $21 AND tenant_id = $22
     RETURNING *`,
    [
      input.title, input.slug, input.description ?? null, input.listing_type,
      input.property_type_id ?? null, input.price, input.currency ?? "NGN",
      input.price_period ?? null, input.bedrooms ?? null, input.bathrooms ?? null,
      input.toilets ?? null, input.parking_spaces ?? null, input.area_value ?? null,
      input.area_unit ?? null, input.address ?? null, input.city ?? null,
      input.state ?? null, input.country ?? "NG", JSON.stringify(input.features ?? []),
      input.assigned_agent_id ?? null, propertyId, tenantId,
    ]
  );
}
