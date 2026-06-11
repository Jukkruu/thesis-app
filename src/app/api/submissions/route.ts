import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STEP_NAMES, ROLE_LABELS } from "@/lib/utils";

const WORKFLOW_ROLES = [
  "STUDENT", "ADMIN", "PROGRAM_CHAIR", "HEAD_EXAM_COMMITTEE",
  "EXAM_COMMITTEE", "ADVISOR", "INVITED_EXAM_COMMITTEE", "PROGRAM_CHAIR",
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
        create: WORKFLOW_ROLES.map((role, i) => ({
          stepOrder: i + 1,
          role,
          status: "PENDING",
          committeeMembers: role === "EXAM_COMMITTEE" ? (data.committeeIds ?? []) : [],
        })),
      },
    },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  // Mark step 1 (STUDENT) as approved immediately
  await prisma.workflowStep.update({
    where: { submissionId_stepOrder: { submissionId: submission.id, stepOrder: 1 } },
    data: { status: "APPROVED", actedAt: new Date(), actedByName: session.user.name, actedById: userId },
  });

  // Notify advisor and admin
  const notifData: any[] = [];
  if (data.advisorId) {
    notifData.push({ recipientId: data.advisorId, message: "มีคำร้องใหม่รอการตรวจสอบ", detail: data.title, submissionId: submission.id, type: "pending" });
  }
  const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
  if (admin) {
    notifData.push({ recipientId: admin.id, message: "มีคำร้องวิทยานิพนธ์ใหม่", detail: data.title, submissionId: submission.id, type: "info" });
  }
  if (notifData.length) await prisma.notification.createMany({ data: notifData });

  const updated = await prisma.submission.findUnique({
    where: { id: submission.id },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });

  return NextResponse.json(mapSub(updated));
}
