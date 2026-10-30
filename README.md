# RealtyOS

**Multi-tenant, white-label real-estate SaaS platform**  
Primary market: Nigeria, designed for international expansion.

One platform. Every real-estate business gets its own workspace, brand, property inventory, customers and operations.

## Current implementation status

| Area | Status |
|---|---|
| Next.js 15 / React 19 / TypeScript foundation | Implemented |
| PostgreSQL schema and tenant data layer | Implemented; live database migration not yet verified |
| Tenant-scoped property, lead and viewing actions | Foundation implemented; end-to-end testing pending |
| Google OAuth | Configurable; requires Google credentials and runtime verification |
| Session-backed user and tenant context | Implemented; runtime verification pending |
| Workspace onboarding | Implemented; requires configured auth and database |
| Dashboard metrics | Tenant-scoped database queries implemented |
| Super-admin overview | Read-only overview implemented |
| First super-admin bootstrap | Secure CLI command implemented |
| Repeatable database migration runner | Implemented; not yet run against production database |
| Public tenant websites and custom-domain routing | Incomplete |
| Media uploads / object storage | Incomplete |
| Billing, Paystack / Flutterwave | Incomplete |
| Production deployment and end-to-end verification | Not yet confirmed |

Do not treat a code feature as production-ready until it has passed runtime and tenant-isolation tests against a configured database.

## Stack

- Next.js App Router, React and TypeScript
- Neon PostgreSQL (\`pg\`)
- Vercel deployment target
- Auth.js / Google OAuth
- Zod validation
- Lucide React

## Local setup

1. Clone and install:

   \`\`\`bash
   git clone https://github.com/mrceogodwin/realtyos.git
   cd realtyos
   npm install
   \`\`\`

2. Create your environment file:

   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Configure at minimum:
   - \`DATABASE_URL\` — PostgreSQL connection string
   - \`AUTH_SECRET\` — long, random Auth.js secret
   - \`AUTH_GOOGLE_ID\` and \`AUTH_GOOGLE_SECRET\` — Google OAuth credentials

   Configure the Google OAuth authorized redirect URI for your local and deployed Auth.js callback endpoints. Keep all secrets server-side; never commit \`.env.local\`.

4. Apply database migrations:

   \`\`\`bash
   npm run db:migrate
   \`\`\`

   The runner applies SQL files in \`db/migrations\` in filename order, tracks checksums in \`schema_migrations\`, rejects edits to already-applied migrations, and uses a PostgreSQL advisory lock to prevent concurrent runs. Review each migration before applying it to a production database.

5. Start the application:

   \`\`\`bash
   npm run dev
   \`\`\`

   Health endpoint: \`http://localhost:3000/api/health\`.

## First platform administrator

Create and sign in to the intended Google account first so it exists as an active, verified row in \`user_profiles\`. Then run the bootstrap command from a trusted local/administrative environment with the database URL and exact account email set:

\`\`\`bash
REALTYOS_BOOTSTRAP_ADMIN_EMAIL=admin@example.com npm run admin:bootstrap
\`\`\`

The script only promotes an existing active, email-verified account. Do not expose this command through a public API or commit its environment values. Use it sparingly and audit administrative role changes.

## Database

The initial migration creates the platform and tenant foundation:

- Tenants, tenant branding and tenant settings
- User profiles and tenant memberships
- Property types, properties, property media and saved properties
- Leads and property viewings
- Tenant pages, subscriptions, audit logs and platform settings

Business records are tenant-scoped. Server actions and APIs must derive tenant identity from the authenticated server-side context; never trust a tenant ID supplied by the browser.

## Quality checks

\`\`\`bash
npm run typecheck
npm run lint
npm run build
\`\`\`

GitHub Actions runs these checks on pushes to the default branch. A green CI run is necessary but does not replace database, authentication, authorization, accessibility or end-to-end testing.

## Security principles

- Enforce tenant and role authorization in every server action and API route.
- Never trust client-supplied tenant identifiers.
- Keep database and provider credentials server-side.
- Use parameterized SQL and validate untrusted input.
- Require verified identity for account provisioning.
- Keep platform-admin promotion out of public request handlers.
- Apply migrations deliberately and retain migration checksums.
- Log sensitive administrative and tenant-management actions.

## License

Private — All rights reserved.
