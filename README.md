# RealtyOS

**Multi-tenant, white-label real-estate SaaS platform**  
Primary market: Nigeria (architecture ready for international expansion)

One platform. Every real-estate business. Its own brand, listings, customers and operations.

---

## Current Status (honest)

| Area | Status |
|------|--------|
| Next.js 15 + TypeScript scaffold | Done |
| Premium dashboard UI (emerald / gold) | Done (demo data) |
| PostgreSQL connection helper + health endpoint | Done |
| Version-controlled database schema | Done (migration 0001) |
| Core domain types + validation | Done |
| Tenant authorization helpers | Done (foundation) |
| Authentication | Not started |
| Persistent property / lead / viewing CRUD | Not started |
| Multi-tenant isolation tests | Not started |
| Tenant public websites | Not started |
| Billing / subscriptions | Not started |
| Vercel production deployment | Not started |

This is **not** a production-ready SaaS yet. The foundation is now in place so we can implement features correctly.

---

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Neon PostgreSQL
- **Hosting**: Vercel
- **Validation**: Zod
- **Icons**: Lucide React

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/mrceogodwin/realtyos.git
cd realtyos

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Edit DATABASE_URL with your Neon connection string

# 4. Apply schema (once)
psql "$DATABASE_URL" -f db/migrations/0001_initial.sql

# 5. Run
npm run dev
```

Health check: `http://localhost:3000/api/health`

---

## Database

The initial migration (`db/migrations/0001_initial.sql`) creates:

- `tenants`, `tenant_branding`, `tenant_settings`
- `user_profiles`, `tenant_memberships`
- `property_types`, `properties`, `property_media`, `saved_properties`
- `leads`, `property_viewings`
- `tenant_pages`, `subscriptions`, `audit_logs`, `platform_settings`

All business tables are scoped by `tenant_id`. Authorization must still be enforced in application code (and later with RLS if desired).

---

## Roadmap (from Master PRD)

1. **Foundation** (current) — schema, types, helpers, clean build
2. **Authentication + tenant onboarding**
3. **Property management (real CRUD)**
4. **CRM + viewings**
5. **Tenant websites & branding**
6. **Team management & reporting**
7. **Super-admin console**
8. **Billing & paid plans**
9. **Production hardening & launch**

---

## Security Principles

- Never trust a client-supplied tenant ID
- Enforce authorization on every server action / API route
- Keep database credentials server-side only
- Use parameterized queries
- Validate all inputs with Zod
- Log sensitive administrative actions

---

## License

Private — All rights reserved.
