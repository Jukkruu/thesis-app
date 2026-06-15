import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStepName, ROLE_LABELS, PROGRAM_LABELS } from "@/lib/utils";
import { sendStepEmail } from "@/lib/email";

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

async function getSub(id: string) {
  return prisma.submission.findUnique({
    where: { id },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });
}

async function notifyRole(role: string, sub: any, message: string, type: string) {
  let recipientId: string | null = null;
  if (role === "STUDENT")              recipientId = sub.studentId;
  else if (role === "ADVISOR")         recipientId = sub.advisorId;
  else if (role === "HEAD_EXAM_COMMITTEE") recipientId = sub.headCommitteeId;
  else if (role === "INVITED_EXAM_COMMITTEE") recipientId = sub.invitedCommitteeId;
  else if (role === "EXAM_COMMITTEE") {
    if (sub.committeeIds?.length) {
      await prisma.notification.createMany({
        data: sub.committeeIds.map((uid: string) => ({
          recipientId: uid, message, detail: sub.title, submissionId: sub.id, type,
        })),
      });
    }
    return;
  } else {
    const user = await prisma.user.findFirst({ where: { role: role as any } });
    recipientId = user?.id ?? null;
  }
  if (recipientId) {
    await prisma.notification.create({
      data: { recipientId, message, detail: sub.title, submissionId: sub.id, type },
    });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const sub = await getSub(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapSub(sub));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;
  const { id: userId, role, name: userName } = session.user;

  const sub = await getSub(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  if (action === "approve") {
    const step = sub.workflowSteps.find((s: any) => s.status === "PENDING");
    if (!step) return NextResponse.json({ error: "No pending step" }, { status: 400 });
    if (step.role !== role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // For STUDENT steps, only the submission's own student can advance
    if (step.role === "STUDENT" && sub.studentId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Enforce required uploads before a student step advances
    if (step.role === "STUDENT") {
      const REQUIRED_UPLOADS: Record<string, Record<number, string[]>> = {
        PROPOSAL:       { 1: ["BW1A", "BW1B"], 4: ["B1C", "B1D"] },
        THESIS_DEFENSE: { 1: ["B2", "B3"], 7: ["SIGNED"], 13: ["B4", "THESIS"] },
      };
      const subType = sub.submissionType ?? "PROPOSAL";
      const required = REQUIRED_UPLOADS[subType]?.[step.stepOrder] ?? [];
      const uploaded = new Set(sub.uploads.map((u: any) => u.formType));
      const missing = required.filter((f) => !uploaded.has(f));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `กรุณาอัปโหลดเอกสารให้ครบก่อน: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    await prisma.workflowStep.update({
      where: { id: step.id },
      data: { status: "APPROVED", actedAt: now, actedByName: userName, actedById: userId, notes: body.notes ?? null },
    });

    const remainingSteps = sub.workflowSteps.filter((s: any) => s.id !== step.id && s.status === "PENDING");
    const isComplete = remainingSteps.length === 0;
    await prisma.submission.update({ where: { id }, data: { status: isComplete ? "COMPLETED" : "IN_PROGRESS" } });

    if (isComplete) {
      await prisma.notification.create({
        data: { recipientId: sub.studentId, message: "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", detail: sub.title, submissionId: id, type: "approved" },
      });
    } else {
      const nextStep = sub.workflowSteps.find((s: any) => s.stepOrder > step.stepOrder && s.status === "PENDING");
      if (nextStep) {
        const stepName = getStepName(nextStep.stepOrder, sub.submissionType) || ROLE_LABELS[nextStep.role as keyof typeof ROLE_LABELS];
        const msg = `ถึงคิวของท่าน: ${stepName}`;
        await notifyRole(nextStep.role, sub, msg, "pending");
        sendStepEmail({ role: nextStep.role, sub, stepName }).catch(() => {});
      }
    }

    if (step.stepOrder === 3 && step.role === "PROGRAM_CHAIR" && sub.submissionType === "PROPOSAL") {
      // Look up names for the finance email
      Promise.all([
        sub.advisorId ? prisma.user.findUnique({ where: { id: sub.advisorId }, select: { name: true } }) : null,
        sub.headCommitteeId ? prisma.user.findUnique({ where: { id: sub.headCommitteeId }, select: { name: true } }) : null,
        (sub.committeeIds as string[] | undefined)?.length
          ? prisma.user.findMany({ where: { id: { in: sub.committeeIds as string[] } }, select: { name: true } })
          : [],
      ]).then(([advisorUser, headUser, committeeUsers]) => {
        fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/email/finance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: sub.studentFullName ?? sub.studentId,
            studentCode: sub.studentCode ?? "-",
            studentEmail: sub.studentEmail,
            studentPhone: sub.studentPhone,
            program: sub.program ? (PROGRAM_LABELS[sub.program] ?? sub.program) : "-",
            thesisTitle: sub.title,
            submissionId: id,
            advisorName: advisorUser?.name,
            headCommitteeName: headUser?.name,
            committeeNames: (committeeUsers as { name: string }[]).map((u) => u.name),
            invitedProfName: (sub as any).invitedProfName,
            invitedProfAffiliation: (sub as any).invitedProfAffiliation,
            examDate: (sub as any).examDate,
            examTime: (sub as any).examTime,
            roomNeeded: (sub as any).roomNeeded,
            parkingNeeded: (sub as any).parkingNeeded,
            carPlate: (sub as any).carPlate,
          }),
        }).catch(() => {});
      }).catch(() => {});
    }
  }

  else if (action === "reject") {
    const step = sub.workflowSteps.find((s: any) => s.status === "PENDING");
    if (!step) return NextResponse.json({ error: "No pending step" }, { status: 400 });
    if (step.role !== role && role !== "ADMIN" && role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Find the closest preceding STUDENT upload step (phase start) and reset the
    // entire phase back to PENDING so the student must re-upload without a manual
    // "resubmit" click. The rejection reason is included in the notification.
    const phaseStart = [...sub.workflowSteps]
      .filter((s: any) => s.role === "STUDENT" && s.stepOrder <= step.stepOrder)
      .sort((a: any, b: any) => b.stepOrder - a.stepOrder)[0] ?? step;

    const idsToReset = sub.workflowSteps
      .filter((s: any) => s.stepOrder >= phaseStart.stepOrder && s.stepOrder <= step.stepOrder)
      .map((s: any) => s.id);

    await prisma.workflowStep.updateMany({
      where: { id: { in: idsToReset } },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });

    await prisma.submission.update({ where: { id }, data: { status: "IN_PROGRESS" } });

    const rejectionMsg = body.notes
      ? `คำร้องถูกปฏิเสธ — "${body.notes}" กรุณาแก้ไขและอัปโหลดเอกสารใหม่`
      : "คำร้องถูกปฏิเสธ — กรุณาแก้ไขและอัปโหลดเอกสารใหม่";
    await prisma.notification.create({
      data: { recipientId: sub.studentId, message: rejectionMsg, detail: sub.title, submissionId: id, type: "rejected" },
    });
  }

  else if (action === "cancel") {
    if (sub.studentId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.workflowStep.updateMany({ where: { submissionId: id, status: "PENDING" }, data: { status: "SKIPPED" } });
    await prisma.submission.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  else if (action === "resubmit") {
    if (sub.studentId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rejectedStep = sub.workflowSteps.find((s: any) => s.status === "REJECTED");
    if (!rejectedStep) return NextResponse.json({ error: "No rejected step" }, { status: 400 });

    // Find the closest preceding STUDENT step (the upload step for this phase).
    // That step and every step up through the rejected step must reset to PENDING
    // so the student re-uploads and the whole phase re-runs.
    const phaseStart = [...sub.workflowSteps]
      .filter((s: any) => s.role === "STUDENT" && s.stepOrder <= rejectedStep.stepOrder)
      .sort((a: any, b: any) => b.stepOrder - a.stepOrder)[0] ?? rejectedStep;

    const idsToReset = sub.workflowSteps
      .filter((s: any) => s.stepOrder >= phaseStart.stepOrder && s.stepOrder <= rejectedStep.stepOrder)
      .map((s: any) => s.id);

    await prisma.workflowStep.updateMany({
      where: { id: { in: idsToReset } },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    await notifyRole(phaseStart.role, sub, "กรุณาอัปโหลดเอกสารใหม่และส่งอีกครั้ง", "pending");
  }

  else if (action === "admin_set_note") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.submission.update({ where: { id }, data: { adminNote: body.note } });
  }

  else if (action === "admin_update") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.submission.update({
      where: { id },
      data: { title: body.title ?? undefined, advisorId: body.advisorId ?? undefined },
    });
  }

  else if (action === "admin_reset") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.workflowStep.updateMany({
      where: { submissionId: id },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  }

  else if (action === "admin_override_step") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { stepOrder, decision, notes } = body;
    await prisma.workflowStep.update({
      where: { submissionId_stepOrder: { submissionId: id, stepOrder } },
      data: { status: decision, actedAt: now, actedByName: userName, actedById: userId, notes: notes ?? null },
    });
    const updatedSub = await getSub(id);
    if (updatedSub) {
      const hasPending  = updatedSub.workflowSteps.some((s: any) => s.status === "PENDING");
      const hasRejected = updatedSub.workflowSteps.some((s: any) => s.status === "REJECTED");
      await prisma.submission.update({ where: { id }, data: { status: hasRejected ? "REJECTED" : hasPending ? "IN_PROGRESS" : "COMPLETED" } });
    }
  }

  else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const result = await getSub(id);
  return NextResponse.json(mapSub(result));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.submission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
