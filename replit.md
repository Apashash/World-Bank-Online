# Banque Mondiale

A full-featured French banking app with dashboard, transfer link generation/sharing, sub-account management, and a referral system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, via `API Server` workflow)
- `pnpm --filter @workspace/bank-mondial run dev` — run the frontend (port 20225, via `artifacts/bank-mondial: web` workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React 19 + Vite (port 20225)
- Auth: JWT via httpOnly cookies (custom, no external provider)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: Recharts (area chart on dashboard)

## Where things live

- `lib/db/src/schema/` — DB schema (source of truth: users, transfers, sub-accounts, referrals, activity)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks + Zod schemas
- `artifacts/bank-mondial/src/pages/` — all app pages
- `artifacts/bank-mondial/src/components/layout.tsx` — main sidebar layout
- `artifacts/api-server/src/routes/` — API route handlers

## Architecture decisions

- Transfer link system: users generate a shareable link (`/transfer/:token`). Anyone with the link can confirm the transfer without logging in (public endpoint `POST /transfers/link/:token/confirm`).
- Referral system: referral code stored on user; `referralsTable` tracks referrer/referred relationships with reward tracking; level system (Bronze/Silver/Gold at 0/5/10 referrals).
- Sub-accounts: child accounts of a parent user with permission-based role system (Agent/Comptable/Support).
- Activity feed: `activityTable` stores chronological events for the dashboard activity panel.
- `customFetch` (in api-client-react) throws `ApiError` on non-2xx, so react-query `data` is `undefined` on errors.

## Product

- **Dashboard**: balance card, weekly area chart (sent/received), 4 stat cards (sent, received, pending, referrals), activity feed
- **Virements**: list of transfers + "Nouveau virement" form that generates a shareable payment link with copy/share buttons
- **Sous-comptes**: CRUD for sub-accounts with role/permission management, activate/suspend, delete
- **Parrainage**: referral code + link, level progression (Bronze/Silver/Gold), list of referrals
- **KYC & Sécurité**: identity verification flow
- **Paramètres**: account settings
- **Transfer link page** (`/transfer/:token`): public page (no auth required) for recipients to view and confirm a transfer

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always use `Array.isArray(data)` guard when rendering lists from react-query hooks — `data || []` is unsafe if data can be a truthy non-array.
- `user.fullName` can be undefined even when `user` is defined; always use `?.charAt(0)?.toUpperCase() ?? "?"`.
- The artifact `artifacts/bank-mondial: web` runs on port 20225 (Replit injects PORT=20225 for artifacts). The `Start application` webview workflow runs on port 5000 (external 80) for the Replit preview pane. Both run in parallel — this is intentional.
- The `activity` DB table requires `pnpm --filter @workspace/db run push` to be run after any schema changes.
- After editing API server code, restart the `API Server` workflow to rebuild and reload.
- `vite.config.ts` defaults PORT=5000 and BASE_PATH=/ so the artifact workflow can run without explicit env vars.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
