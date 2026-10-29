import { NextRequest, NextResponse } from "next/server";
import { listProperties, createProperty } from "@/lib/properties";
import { createPropertySchema } from "@/lib/validation";
import { DatabaseNotConfiguredError } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Temporary development note:
 * These endpoints currently accept a `x-tenant-id` header for testing only.
 * Once authentication is live, the tenant will be resolved exclusively from the
 * authenticated session / membership. Client-supplied tenant IDs will be ignored.
 */

function getTenantId(req: NextRequest): string | null {
  return req.headers.get("x-tenant-id");
}

export async function GET(req: NextRequest) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required (x-tenant-id header for now)" },
      { status: 400 }
    );
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") as any;
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const properties = await listProperties({
      tenantId,
      search,
      status: status || undefined,
      limit: Math.min(limit, 100),
      offset,
    });
    return NextResponse.json({ data: properties });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Database not configured", code: "DB_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("[GET /api/properties]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required (x-tenant-id header for now)" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const property = await createProperty(tenantId, parsed.data);
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Database not configured", code: "DB_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("[POST /api/properties]", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
