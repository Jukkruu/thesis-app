import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

// PROPOSAL: 11 steps — บ.วศ.1ก/1ข then บ.วศ.1ค/1ง
const PROPOSAL_ROLES = [
  "STUDENT",               // 1  upload BW1A + BW1B
  "ADMIN",                 // 2  approve
  "PROGRAM_CHAIR",         // 3  sign BW1A → finance email
  "STUDENT",               // 4  upload B1C + B1D
  "HEAD_EXAM_COMMITTEE",   // 5  sign B1C
  "ADVISOR",               // 6  sign B1C
  "CO_ADVISOR",            // 7  sign B1C (sequential, skipped if no co-advisors)
  "INVITED_EXAM_COMMITTEE",// 8  sign B1C
  "EXAM_COMMITTEE",        // 9  sign B1C + B1D (all members)
  "ADMIN",                 // 10 approve
  "PROGRAM_CHAIR",         // 11 sign B1C + B1D
] as const;

// THESIS_DEFENSE: 22 steps — บ.2/3 through thesis cover signing
const THESIS_ROLES = [
  "STUDENT",               // 1  upload B2 + B3
  "EXAM_COMMITTEE",        // 2  sign B3 (sequential)
  "ADVISOR",               // 3  sign B2
  "CO_ADVISOR",            // 4  sign B2 (sequential, skipped if no co-advisors)
  "HEAD_EXAM_COMMITTEE",   // 5  sign B2
  "PROGRAM_CHAIR",         // 6  sign B2 → notify admin
  "ADMIN",                 // 7  collect + send B2+B3 to Faculty
  "ADMIN",                 // 8  receive faculty docs + upload + send invitation letters
  "STUDENT",               // 9  fill + sign แบบรายงานฯ
  "ADVISOR",               // 10 sign แบบรายงาน + ใบรายงานผล
  "CO_ADVISOR",            // 11 sign แบบรายงาน + ใบรายงานผล (sequential, skipped if none)
  "HEAD_EXAM_COMMITTEE",   // 12 sign ใบรายงานผล
  "EXAM_COMMITTEE",        // 13 sign ใบรายงานผล (sequential)
  "INVITED_EXAM_COMMITTEE",// 14 sign ใบรายงานผล
  "PROGRAM_CHAIR",         // 15 sign ใบรายงานผล
  "STUDENT",               // 16 upload B4 + THESIS
  "PROGRAM_CHAIR",         // 17 sign B4
  "ADVISOR",               // 18 sign thesis cover
  "CO_ADVISOR",            // 19 sign thesis cover (sequential, skipped if none)
  "HEAD_EXAM_COMMITTEE",   // 20 sign thesis cover
  "EXAM_COMMITTEE",        // 21 sign thesis cover (sequential)
  "INVITED_EXAM_COMMITTEE",// 22 sign thesis cover
] as const;

function mapSub(s: any) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    workflowSteps: s.workflowSteps?.map((st: any) => ({
      ...st,
      createdAt: st.createdAt.toISOString(),
      actedAt: st.actedAt?.toISOString() ?? null,
    })) ?? [],
    uploads: s.uploads?.map((u: any) => ({
      ...u,
      uploadedAt: u.uploadedAt.toISOString(),
    })) ?? [],
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = session.user;
  if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const userRoles: string[] = (session.user as any).roles ?? [session.user.role as string];
  const dbUserChair = await prisma.user.findUnique({ where: { id: userId }, select: { isProgramChair: true } });
  const isPrivileged = userRoles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r)) || dbUserChair?.isProgramChair === true;

  let where: any = {};
  if (!isPrivileged) {
    // Involvement-based: show all submissions where user is directly assigned
    where = {
      OR: [
        { studentId: userId },
        { advisorId: userId },
        { coAdvisorIds: { hasSome: [userId] } },
        { committeeIds: { hasSome: [userId] } },
        { headCommitteeId: userId },
        { invitedCommitteeId: userId },
        { programChairId: userId },
      ],
    };
  }
  // ADMIN, SUPER_ADMIN, PROGRAM_CHAIR see all (no where filter)

  const submissions = await prisma.submission.findMany({
    where,
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions.map(mapSub));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const postRoles: string[] = (session?.user as any)?.roles ?? [session?.user?.role ?? ""];
  if (!session?.user || !postRoles.includes("STUDENT"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const userId = session.user.id;

  // ── Committee people: student enters name/email/role/phone for every person
  //    responsible for their thesis. Accounts are found-or-created by email.
  type PersonInput = { name?: string; email?: string; role?: string; phone?: string };
  const PERSON_ROLES = ["ADVISOR", "CO_ADVISOR", "HEAD_EXAM_COMMITTEE", "EXAM_COMMITTEE", "INVITED_EXAM_COMMITTEE", "PROGRAM_CHAIR"];
  const people: PersonInput[] = Array.isArray(data.people) ? data.people : [];

  let advisorId: string | null = data.advisorId || null;
  let coAdvisorIds: string[] = data.coAdvisorIds ?? [];
  let headCommitteeId: string | null = data.headCommitteeId || null;
  let committeeIds: string[] = data.committeeIds ?? [];
  let invitedCommitteeId: string | null = data.invitedCommitteeId || null;
  let programChairId: string | null = null;
  let invitedProfName: string | null = data.invitedProfName ?? null;
  let invitedProfEmail: string | null = data.invitedProfEmail ?? null;
  let invitedProfPhone: string | null = data.invitedProfPhone ?? null;
  const newAccounts: { id: string; name: string; email: string; password: string }[] = [];

  if (people.length) {
    for (const p of people) {
      if (!p.name?.trim() || !p.email?.trim() || !p.role || !PERSON_ROLES.includes(p.role))
        return NextResponse.json({ error: "กรุณากรอกชื่อ อีเมล และบทบาทของกรรมการให้ครบทุกคน" }, { status: 400 });
    }
    const count = (r: string) => people.filter((p) => p.role === r).length;
    if (count("PROGRAM_CHAIR") !== 1)
      return NextResponse.json({ error: "ต้องระบุประธานหลักสูตร 1 คน (เพิ่มได้เพียง 1 คนเท่านั้น)" }, { status: 400 });
    if (count("ADVISOR") !== 1)
      return NextResponse.json({ error: "ต้องระบุอาจารย์ที่ปรึกษา 1 คน" }, { status: 400 });
    if (count("HEAD_EXAM_COMMITTEE") !== 1)
      return NextResponse.json({ error: "ต้องระบุประธานกรรมการสอบ 1 คน" }, { status: 400 });
    if (count("EXAM_COMMITTEE") < 1)
      return NextResponse.json({ error: "ต้องระบุกรรมการสอบอย่างน้อย 1 คน" }, { status: 400 });
    if (count("INVITED_EXAM_COMMITTEE") !== 1)
      return NextResponse.json({ error: "ต้องระบุกรรมการภายนอก 1 คน" }, { status: 400 });

    // Find-or-create one account per unique email (same person may hold several roles)
    const idByEmail = new Map<string, string>();
    for (const p of people) {
      const email = p.email!.trim().toLowerCase();
      if (idByEmail.has(email)) continue;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        idByEmail.set(email, existing.id);
        continue;
      }
      const tempPassword = randomBytes(8).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const created = await prisma.user.create({
        data: { email, name: p.name!.trim(), roles: ["PROFESSOR"], passwordHash },
      });
      idByEmail.set(email, created.id);
      newAccounts.push({ id: created.id, name: created.name, email, password: tempPassword });
    }

    const idOf = (p: PersonInput) => idByEmail.get(p.email!.trim().toLowerCase())!;
    advisorId       = idOf(people.find((p) => p.role === "ADVISOR")!);
    headCommitteeId = idOf(people.find((p) => p.role === "HEAD_EXAM_COMMITTEE")!);
    programChairId  = idOf(people.find((p) => p.role === "PROGRAM_CHAIR")!);
    coAdvisorIds    = people.filter((p) => p.role === "CO_ADVISOR").map(idOf);
    committeeIds    = people.filter((p) => p.role === "EXAM_COMMITTEE").map(idOf);
    const invited   = people.find((p) => p.role === "INVITED_EXAM_COMMITTEE")!;
    invitedCommitteeId = idOf(invited);
    invitedProfName    = invited.name!.trim();
    invitedProfEmail   = invited.email!.trim().toLowerCase();
    invitedProfPhone   = invited.phone?.trim() || null;
  } else if (data.invitedProfEmail) {
    // Legacy path: find-or-create only the invited external committee member
    const existing = await prisma.user.findUnique({ where: { email: data.invitedProfEmail } });
    if (existing) {
      invitedCommitteeId = existing.id;
    } else {
      const tempPassword = randomBytes(8).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const created = await prisma.user.create({
        data: {
          email: data.invitedProfEmail,
          name: data.invitedProfName ?? data.invitedProfEmail,
          roles: ["PROFESSOR"],
          passwordHash,
        },
      });
      invitedCommitteeId = created.id;
      newAccounts.push({ id: created.id, name: created.name, email: created.email, password: tempPassword });
    }
  }

  const submission = await prisma.submission.create({
    data: {
      title: data.title,
      submissionType: data.submissionType,
      status: "IN_PROGRESS",
      studentId: userId,
      advisorId,
      studentFullName: data.studentFullName,
      studentCode: data.studentCode,
      program: data.program,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      headCommitteeId,
      committeeIds,
      coAdvisorIds,
      invitedCommitteeId,
      programChairId,
      invitedProfName,
      invitedProfAffiliation: data.invitedProfAffiliation,
      invitedProfEmail,
      invitedProfPhone,
      examDate: data.examDate,
      examTime: data.examTime,
      roomNeeded: data.roomNeeded ?? false,
      parkingNeeded: data.parkingNeeded ?? false,
      carPlate: data.carPlate,
      workflowSteps: {
        create: (data.submissionType === "THESIS_DEFENSE" ? THESIS_ROLES : PROPOSAL_ROLES).map((role, i) => ({
          stepOrder: i + 1,
          role,
          status: role === "CO_ADVISOR" && !coAdvisorIds.length ? "SKIPPED" : "PENDING",
          committeeMembers:
            role === "EXAM_COMMITTEE"         ? committeeIds :
            role === "CO_ADVISOR"             ? coAdvisorIds :
            role === "INVITED_EXAM_COMMITTEE" && invitedCommitteeId ? [invitedCommitteeId] : [],
        })),
      },
    },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  // Step 1 starts as PENDING — student must upload required files and click submit.
  // The approve action will notify step 2 automatically when step 1 is completed.

  // Welcome emails (with passwords) for accounts created by this submission
  if (newAccounts.length) {
    await Promise.allSettled(
      newAccounts.map((a) =>
        sendWelcomeEmail({ userId: a.id, name: a.name, email: a.email, password: a.password, role: "PROFESSOR" })
          .catch((e) => console.error("[email/committee-welcome]", a.email, e))
      )
    );
  }

  // Notify all admins that a new submission was created (informational)
  const admins = await prisma.user.findMany({ where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } } });
  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({ recipientId: a.id, message: "มีคำร้องวิทยานิพนธ์ใหม่", detail: data.title, submissionId: submission.id, type: "info" })),
    });
  }

  const updated = await prisma.submission.findUnique({
    where: { id: submission.id },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  return NextResponse.json(mapSub(updated));
}
