import { NextRequest, NextResponse } from "next/server";
import { listProperties, createProperty } from "@/lib/properties";
import { createPropertySchema } from "@/lib/validation";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getCurrentAuthContext, requireTenant } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/tenant";

export const dynamic = "force-dynamic";

async function resolveTenant() {
  const context = await getCurrentAuthContext();
  if (!context) return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  try {
    const scoped = requireTenant(context);
    return { tenantId: scoped.tenant.id, membership: scoped.membership };
  } catch {
    return { response: NextResponse.json({ error: "Active workspace required" }, { status: 403 }) };
  }
}

export async function GET(req: NextRequest) {
  const scope = await resolveTenant();
  if ("response" in scope) return scope.response;
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("q") ?? undefined;
  const rawLimit = Number(searchParams.get("limit") ?? 50);
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
  const allowedStatuses = ["draft","published","under_offer","sold","rented","archived"] as const;
  const requestedStatus = searchParams.get("status");
  if (requestedStatus && !allowedStatuses.includes(requestedStatus as typeof allowedStatuses[number])) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  try {
    const properties = await listProperties({ tenantId: scope.tenantId, search, status: requestedStatus || undefined, limit, offset });
    return NextResponse.json({ data: properties });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) return NextResponse.json({ error: "Database not configured", code: "DB_NOT_CONFIGURED" }, { status: 503 });
    console.error("[GET /api/properties]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const scope = await resolveTenant();
  if ("response" in scope) return scope.response;
  if (!hasMinimumRole(scope.membership, "editor")) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  try {
    const property = await createProperty(scope.tenantId, parsed.data);
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) return NextResponse.json({ error: "Database not configured", code: "DB_NOT_CONFIGURED" }, { status: 503 });
    console.error("[POST /api/properties]", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
