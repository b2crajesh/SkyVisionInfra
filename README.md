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

# 3. Install dependencies
npm install --prefix server
npm install --prefix client
npm install   # root, for concurrently + convenience scripts

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
| `npm run db:seed` (root) | `prisma db seed` in `server/` |
| `npm run db:generate` (root) | `prisma generate` in `server/` |
| `npm run build` (root) | Builds server (tsc) and client (vite build) |

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
