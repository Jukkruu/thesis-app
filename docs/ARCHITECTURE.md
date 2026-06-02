# Architecture

A mental model of the codebase so you can find things fast and change them safely.

## Big picture

This is a **client-side mockup**. There is no database and no server logic — every piece
of state lives in React Context and is persisted to `localStorage`. The UI, however, is
built as if a real backend exists, so swapping in Prisma/NextAuth/Supabase later means
replacing function bodies, not rewriting components.

```
Browser
 ├─ AppProvider (src/context/AppContext.tsx)   ← ALL data + workflow logic + localStorage
 ├─ ToastProvider (src/context/ToastContext.tsx)
 └─ Pages (src/app/**)  ── read/write through useApp()
```

## The single source of truth: `AppContext.tsx`

Everything important lives here. If you're changing behaviour, it's almost always this file.

- `MOCK_USERS` — the 10 demo accounts (1 per role + 3 committee members + admin).
- `WORKFLOW_ROLES` — the ordered 8-step workflow as an array of roles. **This array defines the flow.**
- `makeInitial()` — seed submissions (sub-1 in progress, sub-2 at committee, sub-3 completed).
- `makeInitialNotifications()` — seed notifications.
- `STORAGE_KEY` — bump the version suffix (`_v4` → `_v5`) whenever you change seed shape, so old localStorage is discarded.
- Actions: `createSubmission`, `approveCurrentStep`, `rejectCurrentStep`, `committeeSign`,
  `addUpload`, `studentResubmit`, the `admin*` functions, and notification helpers.

### How the workflow advances
1. Each submission has `workflowSteps[]` — one per role in `WORKFLOW_ROLES`, each with a `status`.
2. The "current" step is the first one with `status === "PENDING"`.
3. `approveCurrentStep` marks it APPROVED and the next PENDING step becomes current.
   When none remain → submission `COMPLETED`.
4. `rejectCurrentStep` marks current step REJECTED → submission `REJECTED`.
   `studentResubmit` flips that step back to PENDING.
5. **Committee step is special**: role `EXAM_COMMITTEE` carries `committeeMembers[]` and
   `committeeActions[]`. It only advances when *every* member has approved (`committeeSign`).

### Notifications
Created inside the action functions via `makeNotif` / `notifyRole` / `notifyAdmin`, then
`pushNotifs`. Filtered per-user by `recipientId` in `NotificationBell`.

## Three places the workflow is described (keep in sync!)

The workflow text appears in **three** spots. If you add/rename a step, update all three:

| File | What it holds |
|---|---|
| `src/context/AppContext.tsx` → `WORKFLOW_ROLES` | the actual ordered roles (drives logic) |
| `src/lib/utils.ts` → `STEP_NAMES` | Thai label for each step number (1–8) |
| `src/app/login/page.tsx` → `PHASES` | the 5-phase diagram shown on login |

## Theming & labels — `src/lib/utils.ts`

- `ROLE_LABELS`, `ROLE_DESC`, `ROLE_EMOJI` — per-role text/emoji.
- `ROLE_GRADIENT` — per-role Tailwind gradient (used by headers, login, avatars).
- `FORM_LABELS`, `STATUS_LABELS`, `STEP_LABELS`, `STEP_NAMES`.
- `formatDate`, `formatBytes`, `cn` (clsx + tailwind-merge).

> ⚠️ Tailwind class names must be **complete static strings** in these maps (e.g. `"from-blue-500 to-indigo-600"`).
> Never build class names by interpolation — Tailwind's scanner won't see them and they'll be purged.

## Pages (`src/app`)

- `login/page.tsx` — login form + demo shortcuts + the 5-phase workflow diagram.
- `dashboard/layout.tsx` — sidebar, mobile drawer, notification bell, role nav.
- `dashboard/<role>/page.tsx` — thin wrappers around `<RolePendingList role=... />`.
- `dashboard/<role>/[id]/page.tsx` — thin wrappers around `<RoleSubmissionDetail />`.
- `dashboard/student/**` — student has its own pages (list, submit, detail).
- `dashboard/admin/**` — admin dashboard, submission editor, users list + profile.

## Shared components (`src/components`)

| Component | Role |
|---|---|
| `DashboardHeader` | gradient banner at top of each dashboard |
| `RolePendingList` | pending/history tabs + stats for reviewer roles |
| `RoleSubmissionDetail` | submission view + sign panel for reviewer roles |
| `WorkflowTimeline` | the vertical step timeline |
| `SignatureButton` | approve/reject + signed-file upload (single-signer steps) |
| `CommitteeSignPanel` | multi-member committee signing |
| `FileUploader` | mock PDF upload |
| `StatusBadge` | submission/step status pills |
| `NotificationBell` | bell + portal dropdown (positioned via getBoundingClientRect) |

## Config

- `src/lib/config.ts` → `DEMO_MODE` (from `NEXT_PUBLIC_DEMO_MODE`). Gates demo-only UI.
- `src/lib/roleRoutes.ts` → maps each role to its dashboard path.

## Going live
See the **Going Live** checklist in the root `README.md`. The mock action functions in
`AppContext` are the seams where real API/DB calls plug in.
