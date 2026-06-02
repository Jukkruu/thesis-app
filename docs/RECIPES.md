# Recipes

Copy-paste-friendly steps for the changes you'll make most often. Read
[ARCHITECTURE.md](./ARCHITECTURE.md) first for the mental model.

> After any change to seed data shape, bump `STORAGE_KEY` in `AppContext.tsx`
> (e.g. `_v4` → `_v5`) or old `localStorage` will override your new defaults.

---

## Add a new form type (e.g. บ.5)

1. `src/types/index.ts` → add to the `FormType` union: `... | "B5"`.
2. `src/lib/utils.ts` → add a label in `FORM_LABELS`.
3. (optional) allow students to upload it: add to `STUDENT_FORMS` /
   `SUGGESTED_BY_STEP` in `src/app/dashboard/student/[id]/page.tsx`.

## Add / rename / reorder a workflow step

The flow is defined by `WORKFLOW_ROLES` in `AppContext.tsx`. To change it:

1. `AppContext.tsx` → edit `WORKFLOW_ROLES` (order = step order).
2. `src/lib/utils.ts` → update `STEP_NAMES` (keys are 1-based step numbers).
3. `src/app/login/page.tsx` → update the `PHASES` diagram to match.
4. Update **all** seed submissions in `makeInitial()` so their `workflowSteps`
   array matches the new length/roles, then bump `STORAGE_KEY`.

## Add a new role

1. `src/types/index.ts` → add to the `Role` union.
2. `src/lib/utils.ts` → add entries to `ROLE_LABELS`, `ROLE_DESC`, `ROLE_EMOJI`, `ROLE_GRADIENT`.
3. `src/lib/roleRoutes.ts` → add its dashboard route.
4. `src/context/AppContext.tsx` → add a `MOCK_USERS` entry.
5. Create `src/app/dashboard/<role>/page.tsx` and `[id]/page.tsx`
   (copy an existing reviewer role — they're ~5 lines each).
6. `src/app/dashboard/layout.tsx` → add a nav link if needed.

## Add a notification trigger

In the relevant action inside `AppContext.tsx`, build notifications and call `pushNotifs`:

```ts
pushNotifs([
  notifyRole("ADVISOR", "ข้อความ", sub.title, sub.id, "pending"),  // to a role
  makeNotif(sub.studentId, "ข้อความ", sub.title, sub.id, "approved"), // to a specific user
  notifyAdmin("ข้อความ", sub.title, sub.id, "info"),                  // to admin
]);
```
`type` ∈ `"pending" | "approved" | "rejected" | "info"` (controls icon/color in the bell).

## Add a stat card or change the admin chart

- Reviewer dashboards: edit the `<StatCard>` row in `src/components/RolePendingList.tsx`.
- Admin summary cards + stage chart: `src/app/dashboard/admin/page.tsx`
  (`counts`, `stageData`, `SummaryCard`).

## Change colors / theme of a role

Edit `ROLE_GRADIENT` in `src/lib/utils.ts`. Use a full static class string like
`"from-emerald-500 to-green-600"`. This propagates to the dashboard header, login
avatars, and the workflow diagram automatically.

## Hide all demo-only UI (going live)

Set `NEXT_PUBLIC_DEMO_MODE="false"` (see `.env.example`). This removes the quick-login
buttons on `/login` and the reset-demo tool in admin → users. Gated via `DEMO_MODE`
from `src/lib/config.ts`.

## Common gotchas

- **Tailwind purge**: never interpolate class names. Keep them whole in lookup maps.
- **`"use client"`**: any component using `useApp`, hooks, or browser APIs needs it at the top.
- **localStorage stale data**: bump `STORAGE_KEY` after changing seed shape.
- **Server vs client**: pages that call `useApp()` are client components; there is no
  server data fetching in the mockup.

## Useful commands

```bash
npm run dev      # local dev server
npm run build    # production build (run before committing big changes)
npm run lint     # eslint
```
