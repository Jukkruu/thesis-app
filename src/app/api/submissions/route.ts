import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { id: userId, role } = session.user;
  if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  let where: any = {};
  if (role === "STUDENT")                     where = { studentId: userId };
  else if (role === "ADVISOR")                where = { advisorId: userId };
  else if (role === "CO_ADVISOR")             where = { coAdvisorIds: { hasSome: [userId] } };
  else if (role === "HEAD_EXAM_COMMITTEE")    where = { headCommitteeId: userId };
  else if (role === "EXAM_COMMITTEE")         where = { committeeIds: { hasSome: [userId] } };
  else if (role === "INVITED_EXAM_COMMITTEE") where = { invitedCommitteeId: userId };
  else if (!["ADMIN", "SUPER_ADMIN", "PROGRAM_CHAIR"].includes(role)) return NextResponse.json([]);
  // ADMIN, SUPER_ADMIN, PROGRAM_CHAIR see all

  const submissions = await prisma.submission.findMany({
    where,
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions.map(mapSub));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const userId = session.user.id;

  const submission = await prisma.submission.create({
    data: {
      title: data.title,
      submissionType: data.submissionType,
      status: "IN_PROGRESS",
      studentId: userId,
      advisorId: data.advisorId || null,
      studentFullName: data.studentFullName,
      studentCode: data.studentCode,
      program: data.program,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      headCommitteeId: data.headCommitteeId || null,
      committeeIds: data.committeeIds ?? [],
      coAdvisorIds: data.coAdvisorIds ?? [],
      invitedCommitteeId: data.invitedCommitteeId || null,
      invitedProfName: data.invitedProfName,
      invitedProfAffiliation: data.invitedProfAffiliation,
      invitedProfEmail: data.invitedProfEmail,
      invitedProfPhone: data.invitedProfPhone,
      examDate: data.examDate,
      examTime: data.examTime,
      roomNeeded: data.roomNeeded ?? false,
      parkingNeeded: data.parkingNeeded ?? false,
      carPlate: data.carPlate,
      workflowSteps: {
        create: (data.submissionType === "THESIS_DEFENSE" ? THESIS_ROLES : PROPOSAL_ROLES).map((role, i) => ({
          stepOrder: i + 1,
          role,
          status: role === "CO_ADVISOR" && !(data.coAdvisorIds ?? []).length ? "SKIPPED" : "PENDING",
          committeeMembers:
            role === "EXAM_COMMITTEE" ? (data.committeeIds ?? []) :
            role === "CO_ADVISOR"     ? (data.coAdvisorIds ?? []) : [],
        })),
      },
    },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  // Step 1 starts as PENDING — student must upload required files and click submit.
  // The approve action will notify step 2 automatically when step 1 is completed.

  // Notify all admins that a new submission was created (informational)
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
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
