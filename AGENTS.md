<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: ระบบจัดการวิทยานิพนธ์ (Thesis Management System)

A role-based thesis approval workflow app. **Fully live** — Next.js 16 App Router, Prisma ORM → Supabase PostgreSQL, NextAuth v5 (magic-link email login via Resend), file uploads to Supabase Storage. UI is in Thai.

## Stack & deployment
- **DB**: Prisma + `@prisma/adapter-pg` → Supabase PostgreSQL. Client in `src/lib/prisma.ts` (singleton always cached on `globalThis` — both dev and Vercel production).
- **Auth**: NextAuth v5, magic-link only (no passwords). `src/lib/auth.ts`.
- **Email**: Resend via `src/lib/email.ts` — `sendStepEmail()` on every step advance, finance email at PROPOSAL step 3.
- **Storage**: Supabase Storage bucket `thesis-files`. Upload API at `POST /api/upload`.
- **Deploy**: Vercel, auto-deploys on push to `main` (GitHub: Jukkruu/thesis-app).

### Required env vars (Vercel + local `.env.local`)
```
DATABASE_URL          # Supabase connection string (pooled)
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
FINANCE_EMAIL         # recipient for finance notifications
```

---

## Key facts

- **All API logic is in `src/app/api/`**. State is server-fetched; client state lives in `AppContext` which polls the API.
- Two submission types: **PROPOSAL** (9 steps) and **THESIS_DEFENSE** (18 steps). Step arrays: `PROPOSAL_ROLES` / `THESIS_ROLES` in `src/app/api/submissions/route.ts`.
- **Step names**: `PROPOSAL_STEP_NAMES` / `THESIS_STEP_NAMES` in `src/lib/utils.ts`. Always call `getStepName(stepOrder, submissionType)` — never access the maps directly.
- **EXAM_COMMITTEE steps** track per-member decisions in `committeeActions` (JSON on `WorkflowStep`). All members must approve before the step advances.
- **Required uploads gate**: Before a STUDENT step can advance, the student must upload specific form types. Enforced server-side in `PATCH /api/submissions/[id]` (action `"approve"`) and client-side in the student detail page.
  ```
  PROPOSAL:       step 1 → [BW1A, BW1B],  step 4 → [B1C, B1D]
  THESIS_DEFENSE: step 1 → [B2, B3],      step 7 → [SIGNED],   step 13 → [B4, THESIS]
  ```
- **Tailwind class names in lookup maps must be whole static strings** (no interpolation).
- UI text is Thai; use Sarabun font (already global). Keep UI large and calm — target users include older faculty.

---

## Workflow behaviour — critical rules

### Step 1 is NOT auto-approved
When a submission is created, **step 1 starts as PENDING**. The student must upload the required documents and click submit. Step 2's email notification fires automatically when the student's submit action (approve) completes.

### Rejection auto-resets the phase
When any step is **rejected**, the API immediately resets the workflow back to the preceding STUDENT upload step — the student does NOT need to click a separate "resubmit" button. The rejection reason is delivered via in-app notification.

Reset logic (in `PATCH /api/submissions/[id]` action `"reject"`):
1. Find the closest preceding STUDENT step at or before the rejected step → `phaseStart`
2. Reset all steps from `phaseStart` through the rejected step to `PENDING` (clear notes, actedAt, committeeActions)
3. Set submission status to `IN_PROGRESS`
4. Notify student with rejection reason

### Download filtering in SignatureButton
`SignatureButton` accepts a `formsToShow?: string[]` prop. `RoleSubmissionDetail` computes this from a per-step map (`STEP_SIGN_FORMS`) so each role only sees the documents they need to physically sign — not every upload ever attached to the submission.

```
PROPOSAL:       2→[BW1A,BW1B]  3→[BW1A]  5→[B1C]  6→[B1C]  8→[B1C,B1D]  9→[B1C,B1D]
THESIS_DEFENSE: 3→[B2]  4→[B2]  5→[B2]  6→[B2,B3]  8→[SIGNED]  9→[SIGNED]
                11→[SIGNED]  12→[SIGNED]  14→[B4]  15→[THESIS]  16→[THESIS]  18→[THESIS]
```

---

## Conventions
- Reuse role colors via `ROLE_GRADIENT` / `ROLE_EMOJI` / `ROLE_LABELS` in `lib/utils.ts`.
- Run `npm run build` before committing non-trivial changes.
- No `STEP_NAMES` direct usage anywhere — always `getStepName(stepOrder, submissionType)`.
- Prisma singleton: `src/lib/prisma.ts` uses `globalForPrisma.prisma ?? createClient()` then always sets `globalForPrisma.prisma = prisma`. Never add a `NODE_ENV !== "production"` guard — that was the bug that caused connection exhaustion on Vercel.

---

## Roles in the system

### In-system roles (have accounts and login)
| Role | Thai | Key Actions |
|---|---|---|
| Super Admin | ผู้ดูแลระบบสูงสุด | Create/delete users, assign roles, override any workflow step |
| Admin | เจ้าหน้าที่ภาควิชา (พี่โบ้) | Approve submissions, relay documents to Faculty, forward docs to Student |
| Student | นิสิต | Upload documents, assign committee members, track status |
| Advisor | อาจารย์ที่ปรึกษา | Sign forms, monitor assigned students |
| Program Chair | ประธานหลักสูตร | Sign at multiple phases |
| Head Exam Committee | ประธานกรรมการสอบ | Signs before regular committee — assigned per submission by Student |
| Exam Committee | กรรมการสอบ | Multiple members, sign separately in order — assigned per submission by Student |
| Invited Exam Committee | กรรมการภายนอก | External examiner — assigned per submission by Student |

### External roles (no login)
| Role | How they interact |
|---|---|
| Faculty Dean | Signs บ.4 physically offline |
| Finance | Receives email at end of PROPOSAL Phase 1 only |
| Graduate School | Receives final document package outside the system |

---

## Submission fields (from Google Form — source of truth)

**Student info:** ชื่อ-นามสกุล, รหัสนิสิต, หลักสูตร (ป.เอก / ป.โท เครื่องกล / ป.โท CPS), อีเมล์, เบอร์โทร

**Committee (all assigned per submission by Student):** Advisor, Head Exam Committee, Exam Committee member/s, Invited Exam Committee

**Exam logistics:** วันที่สอบ + เวลา, ห้องประชุม (yes/no), ที่จอดรถ (yes/no), เลขทะเบียนรถ

---

## Workflow — source of truth

### PROPOSAL (9 steps)

#### Phase 1 (Steps 1–3): บ.วศ.1ก + บ.วศ.1ข
| Step | Role | Action |
|------|------|--------|
| 1 | STUDENT | Upload BW1A (บ.วศ.1ก) + BW1B (บ.วศ.1ข) — **starts PENDING, student must submit** |
| 2 | ADMIN | Review and approve |
| 3 | PROGRAM_CHAIR | Sign บ.วศ.1ก → **triggers finance email** |

#### Phase 2 (Steps 4–9): บ.วศ.1ค + บ.วศ.1ง
| Step | Role | Action |
|------|------|--------|
| 4 | STUDENT | Upload B1C (บ.วศ.1ค) + B1D (บ.วศ.1ง) |
| 5 | HEAD_EXAM_COMMITTEE | Sign บ.วศ.1ค |
| 6 | ADVISOR | Sign บ.วศ.1ค |
| 7 | EXAM_COMMITTEE | All members sign บ.วศ.1ค (all must approve before advancing) |
| 8 | ADMIN | Verify and approve |
| 9 | PROGRAM_CHAIR | Sign บ.วศ.1ค + บ.วศ.1ง |

If rejected → phase auto-resets to step 1 (Phase 1 rejection) or step 4 (Phase 2 rejection).

---

### THESIS_DEFENSE (18 steps)

#### Phase 3 (Steps 1–5): บ.2 + บ.3
| Step | Role | Action |
|------|------|--------|
| 1 | STUDENT | Upload B2 (บ.2) + B3 (บ.3) — **starts PENDING, student must submit** |
| 2 | EXAM_COMMITTEE | All members sign บ.3 |
| 3 | ADVISOR | Sign บ.2 |
| 4 | HEAD_EXAM_COMMITTEE | Sign บ.2 |
| 5 | PROGRAM_CHAIR | Sign บ.2 |

#### Phase 4 (Step 6): Faculty relay
| Step | Role | Action |
|------|------|--------|
| 6 | ADMIN | Send docs to Faculty; receive back and forward to Student |

Faculty returns: ใบรายงานผลการสอบ, แบบรายงานฯ, invitation letter, แบบประเมิน "วิทยานิพนธ์ดีมาก" (Very Good only)

#### Phase 5 (Steps 7–12): Post-defense signing
| Step | Role | Action |
|------|------|--------|
| 7 | STUDENT | Upload invitation letter + แบบรายงานการเสนอผลงานฯ (formType: SIGNED) |
| 8 | HEAD_EXAM_COMMITTEE | Sign ใบรายงานผลการสอบ |
| 9 | ADVISOR | Sign แบบรายงานฯ + ใบรายงานผลการสอบ |
| 10 | EXAM_COMMITTEE | All members sign ใบรายงานผลการสอบ |
| 11 | INVITED_EXAM_COMMITTEE | Sign ใบรายงานผลการสอบ |
| 12 | PROGRAM_CHAIR | Sign ใบรายงานผลการสอบ |

#### Phase 6 (Steps 13–18): Thesis submission + cover signing
| Step | Role | Action |
|------|------|--------|
| 13 | STUDENT | Upload B4 + THESIS (from e-thesis system, with barcode) |
| 14 | PROGRAM_CHAIR | Sign บ.4 |
| 15 | HEAD_EXAM_COMMITTEE | Sign thesis cover |
| 16 | ADVISOR | Sign thesis cover |
| 17 | EXAM_COMMITTEE | All members sign thesis cover |
| 18 | INVITED_EXAM_COMMITTEE | Sign thesis cover |

If rejected at any step → auto-resets to nearest preceding STUDENT step (step 1, 7, or 13).

---

## Key rules
- **Sequential only** — no parallel signing
- **EXAM_COMMITTEE** steps: all `committeeIds` members must approve (tracked via `committeeActions` JSON on `WorkflowStep`)
- **Finance email** fires at PROPOSAL step 3 (PROGRAM_CHAIR approval) via `POST /api/email/finance`
- **Admin (พี่โบ้)** relays at THESIS_DEFENSE step 6 — collects from Faculty, forwards to Student
- **Student upload steps** start PENDING; student uploads required files then clicks submit to advance
- **Rejection** immediately resets the phase — no separate resubmit step needed
