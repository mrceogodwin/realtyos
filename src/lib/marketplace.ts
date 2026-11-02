import { queryMany } from "./db";

export type MarketplaceProperty = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  listing_type: string;
  price: number;
  currency: string;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_value: number | null;
  area_unit: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  tenant_name: string;
  tenant_slug: string;
  logo_url: string | null;
  primary_color: string;
  cover_url: string | null;
};

export type MarketplaceFilters = {
  q?: string;
  listingType?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};

const allowedListingTypes = new Set(["sale", "rent", "lease", "short_let"]);

export async function listMarketplaceProperties(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceProperty[]> {
  const clauses = [
    "p.status = 'published'",
    "t.status = 'active'",
      ];
  const values: unknown[] = [];
  const add = (value: unknown) => {
    values.push(value);
    return "$" + values.length;
  };

  if (filters.q?.trim()) {
    const p = add("%" + filters.q.trim().slice(0, 100) + "%");
    clauses.push(`(p.title ILIKE ${p} OR p.description ILIKE ${p} OR p.city ILIKE ${p} OR p.state ILIKE ${p} OR t.name ILIKE ${p})`);
  }
  if (filters.listingType && allowedListingTypes.has(filters.listingType)) {
    clauses.push(`p.listing_type = ${add(filters.listingType)}`);
  }
  if (filters.city?.trim()) clauses.push(`p.city ILIKE ${add("%" + filters.city.trim().slice(0, 80) + "%")}`);
  if (filters.state?.trim()) clauses.push(`p.state ILIKE ${add("%" + filters.state.trim().slice(0, 80) + "%")}`);
  if (Number.isFinite(filters.minPrice) && (filters.minPrice ?? 0) >= 0) clauses.push(`p.price >= ${add(filters.minPrice)}`);
  if (Number.isFinite(filters.maxPrice) && (filters.maxPrice ?? 0) >= 0) clauses.push(`p.price <= ${add(filters.maxPrice)}`);

  const limit = Math.min(Math.max(filters.limit ?? 24, 1), 60);
  values.push(limit);

  return queryMany<MarketplaceProperty>(
    `SELECT p.id, p.tenant_id, p.title, p.slug, p.description, p.listing_type,
            COALESCE(p.price, 0)::float8 AS price, p.currency, p.price_period, p.bedrooms, p.bathrooms,
            p.area_value::float8 AS area_value, p.area_unit, p.address_line AS address, p.city, p.state,
            t.name AS tenant_name, t.slug AS tenant_slug,
            tb.logo_url, tb.primary_color,
            media.cover_url
       FROM properties p
       JOIN tenants t ON t.id = p.tenant_id
       LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
       LEFT JOIN LATERAL (
         SELECT pm.public_url AS cover_url
           FROM property_media pm
          WHERE pm.property_id = p.id
            AND pm.tenant_id = p.tenant_id
            AND pm.media_type = 'image'
          ORDER BY pm.is_cover DESC, pm.sort_order ASC, pm.created_at ASC
          LIMIT 1
       ) media ON true
      WHERE ${clauses.join(" AND ")}
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT ${values.length}`,
    values
  );
}

export async function getMarketplaceProperty(
  tenantSlug: string,
  propertySlug: string
): Promise<MarketplaceProperty | null> {
  const rows = await queryMany<MarketplaceProperty>(
    `SELECT p.id, p.tenant_id, p.title, p.slug, p.description, p.listing_type,
            COALESCE(p.price, 0)::float8 AS price, p.currency, p.price_period, p.bedrooms, p.bathrooms,
            p.area_value::float8 AS area_value, p.area_unit, p.address_line AS address, p.city, p.state,
            t.name AS tenant_name, t.slug AS tenant_slug,
            tb.logo_url, tb.primary_color,
            media.cover_url
       FROM properties p
       JOIN tenants t ON t.id = p.tenant_id
       LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
       LEFT JOIN LATERAL (
         SELECT pm.public_url AS cover_url
           FROM property_media pm
          WHERE pm.property_id = p.id
            AND pm.tenant_id = p.tenant_id
            AND pm.media_type = 'image'
          ORDER BY pm.is_cover DESC, pm.sort_order ASC, pm.created_at ASC
          LIMIT 1
       ) media ON true
      WHERE t.slug = $1 AND p.slug = $2
        AND t.status = 'active'
        AND p.status = 'published'
      LIMIT 1`,
    [tenantSlug, propertySlug]
  );
  return rows[0] ?? null;
}
