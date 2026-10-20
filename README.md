# Sky Vision Infra & Developers — Full-Stack Web App

Public marketing site + membership/sponsor/referral program content, with secure
Admin and Member portals backed by PostgreSQL (via Prisma).

Stack: Node.js/Express + PostgreSQL + Prisma (TypeScript) backend; React + Vite +
TypeScript + Tailwind CSS frontend.

## Project layout

```
sky-vision-infra/
  docker-compose.yml   Postgres service for local dev
  server/               Express API (TypeScript, Prisma)
  client/               React + Vite + TypeScript + Tailwind frontend
```

## Prerequisites

- Node.js 18+
- Docker Desktop (for local Postgres) — or your own Postgres instance

## Setup (from a clean checkout)

```bash
# 1. From the repo root: start Postgres
docker compose up -d

# 2. Configure environment files
copy server\.env.example server\.env
copy client\.env.example client\.env
# Edit server/.env if you changed DB credentials/ports; the defaults match docker-compose.yml.

# 3. Install dependencies for the root, server, and client
npm run install:all

# 4. Create the database schema
npm run db:migrate
# (equivalent to: cd server && npx prisma migrate dev --name init)

# 5. Seed reference data + demo admin/members
npm run db:seed
# (equivalent to: cd server && npx prisma db seed)
# This prints the seeded ADMIN login (userId/password) and demo MEMBER
# userIds/temp-passwords to the console — copy them before they scroll away.

# 6. Run both apps together
npm run dev
# Server: http://localhost:4000   Client: http://localhost:5173
```

## Login

- **Admin**: `userId: admin`, `password: Admin@12345` (seeded by
  `server/prisma/seed.ts` — this is the source of truth if it's ever changed).
- **Members log in with their memberCode as the userId** (e.g. `SVI000001`),
  not a separate username. Every member is created with a random, one-time
  temporary password. When an admin uses **Add Member**, the temp password is
  shown once in a success dialog — it is never stored in plaintext or logged,
  and cannot be retrieved again after that dialog is dismissed (an admin would
  need to reset it via the database / a future "reset password" feature).
  The seed script creates 3 demo members (`SVI000001`, `SVI000002`,
  `SVI000003`) and prints each one's temp password to the console the same
  way — copy them from the `npm run db:seed` output before they scroll away.

## Key scripts

| Command | What it does |
|---|---|
| `npm run dev` (root) | Runs server + client concurrently |
| `npm run db:migrate` (root) | `prisma migrate dev` in `server/` |
| `npm run db:migrate:deploy` (root) | Applies committed migrations with `prisma migrate deploy` |
| `npm run db:seed` (root) | `prisma db seed` in `server/` |
| `npm run db:generate` (root) | `prisma generate` in `server/` |
| `npm run build` (root) | Builds server (tsc) and client (vite build) |

## Production deployment on GoDaddy Node.js Hosting

This project uses GoDaddy's Node.js Hosting GitHub deployment. The app now has
root-level `build` and `start` scripts, compiles the API and client, and serves
the React build from the Express app. Deploy it as one app on
`https://skyvisioninfra.com`; API requests use the same origin at `/api`.

GoDaddy's **Root path** setting controls a URL prefix, not the repository
working directory. Keep it blank to serve the app at the domain root. Do not set
it to `/server`.

Configure production values under the app's **Settings → Secrets**. Never
commit production values to `.env` files:

| Name | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | The PostgreSQL URL from GoDaddy; encode reserved characters in credentials |
| `JWT_SECRET` | A newly generated, long, random secret |
| `JWT_EXPIRES_IN` | `15m` (or your chosen short-lived token policy) |
| `CLIENT_ORIGIN` | `https://skyvisioninfra.com` |
| `COOKIE_SECURE` | `true` |

GoDaddy provides the assigned `PORT`. The root `build` script installs the
server/client package dependencies and builds both apps; the root `start` script
runs the compiled API. Build tools are listed as production dependencies so
they are available in GoDaddy's build environment. Do not set the app's start
command to `npm run dev`.

The Prisma client uses the PostgreSQL driver adapter, so the running app does
not depend on a host-installed OpenSSL shared library. Set `DATABASE_URL` in
the hosting secrets before publishing; the app exits at startup if it is
missing. Rebuild and republish after changing the Prisma schema or dependencies
so the generated client and runtime packages match.

The server writes rotating request logs to `server/logs/access.log` and
application/database startup events and errors to
`server/logs/application.log` (14 daily files are retained). Ensure the hosting
runtime can write to `server/logs`; these files are server-side diagnostics and
must not be served publicly or committed with customer data.

### Database safety

The current Prisma schema is newer than the original checked-in migration. The
additional migration in this repository adds the missing
`mustChangePassword`, `phone`, and `email` columns and the `Commission` table.
It is additive and uses existence checks, but it does not replace inspecting
the target database.

- Take and verify a fresh database backup first.
- Confirm the database is the one used by this app and that the original
  `20260921105317_init` migration is recorded as applied in
  `_prisma_migrations`. If migration history is missing, the schema differs,
  or Prisma reports drift, stop and reconcile the database before deploying.
- Only after that verification, run `npm run db:migrate:deploy` from the
  repository root. Do not run a database migration from the Hosting preview
  unless the database backup and migration history have been checked.
- Do **not** run `prisma migrate dev`, `prisma db push`, `migrate reset`, or
  `npm run db:seed` against production. The seed script creates demo accounts
  and contains a fixed development admin password.

### Smoke-test

- Confirm `https://skyvisioninfra.com/health` returns `{"status":"ok"}`.
- Open `https://skyvisioninfra.com`, test login with an existing non-demo
  account, and verify authenticated API requests work over HTTPS.
- Check the app logs if the health check or login fails. Do not paste secrets
  or database connection strings into logs or support messages.

### Production data-protection warning

Member Aadhaar and PAN values are stored in the database. Although list
responses mask these values, that does not encrypt the stored data. Before
launching with real member data, confirm your legal and security requirements,
restrict database access, and plan appropriate encryption, backups, retention,
and incident-response controls.

## Security notes

- JWT is issued on login and stored as an httpOnly cookie; a separate,
  readable CSRF cookie is echoed back as a header on state-changing requests
  (double-submit CSRF pattern).
- Aadhaar/PAN numbers are stored in full but masked (`XXXX-XXXX-1234`) in
  every API response used by list/dashboard views — masking is centralized
  in `server/src/services/memberSerializer.ts` / `server/src/utils/mask.ts`.
- Member codes (`SVI000001`, …) are generated server-side inside a database
  transaction against a counter row — the client never supplies or influences
  the code.
- The Commission Plan page includes a prominent disclaimer: commissions are
  **not guaranteed income** and are subject to eligibility, qualifying
  activity, and the company's compensation-plan terms.

## Known gaps / TODOs

- No automated test suite (unit/integration/e2e) yet.
- No password-reset/forgot-password flow for members (admin re-provisioning
  only).
- No file/image upload for property listings (Properties page uses static
  placeholder content, explicitly marked illustrative).
- No pagination caching / infinite-scroll optimizations — pagination is
  simple offset-based.
- Rate limiting is in-memory (per process); for multi-instance production
  deployments, back it with Redis.
- No end-to-end verification against a live Postgres instance was performed
  in this environment (no local Postgres available) — schema was validated
  with `prisma validate`/`prisma generate`, and both apps type-check/build
  cleanly, but `prisma migrate dev` / `prisma db seed` / full runtime
  request flows have not been exercised. Run the Setup steps above to do so.
