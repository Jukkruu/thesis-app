import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PROPOSAL: 9 steps — บ.วศ.1ก/1ข then บ.วศ.1ค/1ง
const PROPOSAL_ROLES = [
  "STUDENT",               // 1  upload BW1A + BW1B
  "ADMIN",                 // 2  approve
  "PROGRAM_CHAIR",         // 3  sign BW1A → finance email
  "STUDENT",               // 4  upload B1C + B1D
  "HEAD_EXAM_COMMITTEE",   // 5  sign B1C
  "ADVISOR",               // 6  sign B1C
  "EXAM_COMMITTEE",        // 7  sign B1C (all members)
  "ADMIN",                 // 8  approve
  "PROGRAM_CHAIR",         // 9  sign B1C + B1D
] as const;

// THESIS_DEFENSE: 18 steps — บ.2/3 through thesis cover signing
const THESIS_ROLES = [
  "STUDENT",               // 1  upload B2 + B3
  "EXAM_COMMITTEE",        // 2  sign B3 (sequential)
  "ADVISOR",               // 3  sign B2
  "HEAD_EXAM_COMMITTEE",   // 4  sign B2
  "PROGRAM_CHAIR",         // 5  sign B2 → notify admin
  "ADMIN",                 // 6  upload faculty docs + relay
  "STUDENT",               // 7  sign แบบรายงานฯ (student fills + signs)
  "ADVISOR",               // 8  sign แบบรายงาน + ใบรายงานผล
  "HEAD_EXAM_COMMITTEE",   // 9  sign ใบรายงานผล
  "EXAM_COMMITTEE",        // 10 sign ใบรายงานผล (sequential)
  "INVITED_EXAM_COMMITTEE",// 11 sign ใบรายงานผล
  "PROGRAM_CHAIR",         // 12 sign ใบรายงานผล
  "STUDENT",               // 13 upload B4 + THESIS
  "PROGRAM_CHAIR",         // 14 sign B4
  "ADVISOR",               // 15 sign thesis (3 points)
  "HEAD_EXAM_COMMITTEE",   // 16 sign thesis cover
  "EXAM_COMMITTEE",        // 17 sign thesis cover (sequential)
  "INVITED_EXAM_COMMITTEE",// 18 sign thesis cover
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
  else if (role === "HEAD_EXAM_COMMITTEE")    where = { headCommitteeId: userId };
  else if (role === "EXAM_COMMITTEE")         where = { committeeIds: { hasSome: [userId] } };
  else if (role === "INVITED_EXAM_COMMITTEE") where = { invitedCommitteeId: userId };
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
          status: "PENDING",
          committeeMembers: role === "EXAM_COMMITTEE" ? (data.committeeIds ?? []) : [],
        })),
      },
    },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  // Step 1 starts as PENDING — student must upload required files and click submit.
  // The approve action will notify step 2 automatically when step 1 is completed.

  // Notify admin that a new submission was created (informational)
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  if (admin) {
    await prisma.notification.create({
      data: { recipientId: admin.id, message: "มีคำร้องวิทยานิพนธ์ใหม่", detail: data.title, submissionId: submission.id, type: "info" },
    });
  }

  const updated = await prisma.submission.findUnique({
    where: { id: submission.id },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  return NextResponse.json(mapSub(updated));
}
