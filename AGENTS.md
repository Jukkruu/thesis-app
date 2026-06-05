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

## Roles in the system

### In-system roles (have accounts and login)
| Role | Thai | Key Actions |
|---|---|---|
| Super Admin | ผู้ดูแลระบบสูงสุด | Create/delete users, assign roles, override any workflow step, view audit logs |
| Admin | เจ้าหน้าที่ภาควิชา (พี่โบ้) | Approve submissions, relay documents to Faculty, forward docs to Student |
| Student | นิสิต | Fill forms, upload documents, assign committee members, track status |
| Advisor | อาจารย์ที่ปรึกษา | Sign forms, monitor assigned students' progress |
| Program Chair | ประธานหลักสูตร | Sign at Phase 1, 2, 3, 5 |
| Head Exam Committee | ประธานกรรมการสอบ | Signs before regular committee in Phase 2, 3, 5 — assigned per submission by Student |
| Exam Committee | กรรมการสอบ | Multiple members, sign separately in order — assigned per submission by Student |
| Invited Exam Committee | กรรมการภายนอก | External examiner, Phase 5 only — assigned per submission by Student |

### External roles (no login — interact outside the system)
| Role | How they interact |
|---|---|
| Faculty Dean | Signs บ.4 physically offline |
| Finance | Receives email notification at end of Phase 1 only |
| Graduate School | Receives final document package outside the system |

---

## Submission fields (from old Google Form — source of truth)

When a Student creates a new submission, they must fill:

**Student info:**
- ชื่อ-นามสกุล
- รหัสนิสิต
- หลักสูตร: ป.เอก / ป.โท สาขาเครื่องกล / ป.โท สาขา CPS
- อีเมล์
- เบอร์โทรศัพท์

**Committee assignment (all assigned by Student per submission):**
- อาจารย์ที่ปรึกษา (Advisor)
- ประธานกรรมการสอบ (Head Exam Committee)
- กรรมการสอบ (Exam Committee member/s)
- กรรมการภายนอก (Invited/External Exam Committee)

**Exam logistics:**
- วันที่สอบ + เวลา
- ต้องการใช้ห้องประชุม (yes/no)
- ต้องการที่จอดรถให้กรรมการภายนอก (yes/no)
- เลขทะเบียนรถ (if parking needed)

**Important rules:**
- Program type (ป.เอก vs ป.โท) may affect required forms and number of committee members
- All committee roles are per submission — no fixed department-level assignments
- Invited Exam Committee must have been contacted by the Student beforehand (they agree offline first)

---

## Deploy
Hosted on Vercel, auto-deploys on push to `main` (GitHub: Jukkruu/thesis-app).
No env vars required while in mockup mode.

---

## Detailed Workflow (from admin interview — source of truth)

This is the **exact process** gathered from interviewing พี่โบ้ (Dept. Staff who currently manages everything manually over Line). Use this when implementing or adjusting workflow steps.

### Phase 1 — บ.วศ.1ก + บ.วศ.1ข
1. Student fills individual info + uploads บ.วศ.1ก (must already have Advisor signature) + บ.วศ.1ข
2. Admin approves submission
3. System sends email notification to Finance
4. Program Chair signs บ.วศ.1ก
5. ✅ บ.วศ.1ก + บ.วศ.1ข complete

### Phase 2 — บ.วศ.1ค + บ.วศ.1ง
1. Student uploads บ.วศ.1ค + บ.วศ.1ง (all fields must be filled)
2. Head Exam Committee signs บ.วศ.1ค
3. Advisor signs บ.วศ.1ค
4. Exam Committee members sign บ.วศ.1ค **in order** (sequential, not parallel)
5. If all approved → Admin approves → Program Chair signs บ.วศ.1ค + บ.วศ.1ง
6. If rejected → Student fixes and re-uploads
7. ✅ บ.วศ.1ค + บ.วศ.1ง complete

### Phase 3 — บ.2 + บ.3
1. Student uploads บ.2 (with student's own signature) + บ.3 (all fields filled)
2. Exam Committee members each sign บ.3 **separately**
3. If all committee approved → continue; else Student fixes thesis
4. Advisor signs บ.3
5. Head Exam Committee signs บ.3
6. Program Chair signs บ.3
7. Admin collects and sends to Faculty
8. ✅ บ.2 + บ.3 complete

### Phase 4 — Faculty issues exam documents
Faculty sends back to Admin:
- ใบรายงานผลการสอบวิทยานิพนธ์
- แบบรายงานการเสนอผลงานทางวิชาการของนิสิต ระดับบัณฑิตศึกษา
- Invitation letter
- แบบประเมินผล "วิทยานิพนธ์ดีมาก" **(only when thesis result = Very Good)**

Admin forwards all documents to Student.

### Phase 5 — Post-defense signing
1. Student uploads invitation letter + แบบรายงานการเสนอผลงานทางวิชาการ (with student signature, all fields filled)
2. Head Exam Committee signs ใบรายงานผลการสอบวิทยานิพนธ์
3. Advisor signs แบบรายงานการเสนอผลงานทางวิชาการ + ใบรายงานผลการสอบวิทยานิพนธ์ + uploads แบบประเมินผล "วิทยานิพนธ์ดีมาก" **(only if Very Good, all fields filled)**
4. Exam Committee signs ใบรายงานผลการสอบวิทยานิพนธ์
5. **Invited** Exam Committee signs ใบรายงานผลการสอบวิทยานิพนธ์ (separate role from regular committee)
6. Program Chair signs ใบรายงานผลการสอบวิทยานิพนธ์
7. ✅ Phase 5 complete

> More phases to be added later.

### Key rules
- **Signing is always sequential** unless stated otherwise — never parallel except where noted
- **"Very Good" flag** — แบบประเมินผล "วิทยานิพนธ์ดีมาก" only flows when `thesisResult === 'VERY_GOOD'`
- **Invited Exam Committee** is a distinct role from regular Exam Committee
- **Finance** receives an email notification at the end of Phase 1 (currently stubbed)
- **Admin (พี่โบ้)** is the relay point between the department and Faculty — she currently does this manually over Line, which this system replaces
- UI must be simple and large — target users include older faculty members
