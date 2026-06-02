<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: ระบบจัดการวิทยานิพนธ์ (Thesis Management System)

A role-based thesis approval workflow app. **Currently a client-side mockup** — all
state lives in React Context + `localStorage`, no backend yet. UI is in Thai.

## Read these first
- `docs/ARCHITECTURE.md` — the mental model (where everything lives, how the workflow runs).
- `docs/RECIPES.md` — step-by-step for common changes (add a role/step/form/notification).
- `README.md` — feature list, roles, and the **Going Live** checklist.

## Key facts
- **All data + workflow logic is in `src/context/AppContext.tsx`** — start there.
- Workflow = 8 ordered steps (`WORKFLOW_ROLES`) across 5 display phases.
  The committee step needs all 3 members to sign before advancing.
- Workflow is described in 3 places that must stay in sync: `WORKFLOW_ROLES`
  (AppContext), `STEP_NAMES` (lib/utils.ts), and `PHASES` (login page).
- After changing seed data shape, **bump `STORAGE_KEY`** in AppContext (`_v4` → `_v5`).
- Tailwind class names in lookup maps must be **whole static strings** (no interpolation).
- Demo-only UI is gated by `DEMO_MODE` (`src/lib/config.ts` / `NEXT_PUBLIC_DEMO_MODE`).

## Conventions
- UI text is Thai; use the Sarabun font (already global).
- Reuse role colors via `ROLE_GRADIENT` / `ROLE_EMOJI` / `ROLE_LABELS` in `lib/utils.ts`.
- Run `npm run build` before committing non-trivial changes.
- Target users include older faculty — keep UI large, calm, and simple (no flashy motion).

## Deploy
Hosted on Vercel, auto-deploys on push to `main` (GitHub: Jukkruu/thesis-app).
No env vars required while in mockup mode.
