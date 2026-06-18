import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStepName, ROLE_LABELS } from "@/lib/utils";
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EXAM_COMMITTEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: submissionId } = await params;
  const { decision, notes } = await req.json();
  const { id: userId, name: userName } = session.user;

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const step = sub.workflowSteps.find((s: any) => s.status === "PENDING" && s.role === "EXAM_COMMITTEE");
  if (!step) return NextResponse.json({ error: "No pending committee step" }, { status: 400 });
  if (!(step.committeeMembers as string[])?.includes(userId))
    return NextResponse.json({ error: "Not assigned to this submission" }, { status: 403 });

  const prevActions: any[] = (step.committeeActions as any[]) ?? [];
  if (prevActions.some((a) => a.userId === userId))
    return NextResponse.json({ error: "Already signed" }, { status: 400 });

  // Enforce sequential order: all members before this one must have approved first
  const memberIndex = (step.committeeMembers as string[]).indexOf(userId);
  const prevMembers = (step.committeeMembers as string[]).slice(0, memberIndex);
  const notYetSigned = prevMembers.filter(
    (mid) => prevActions.find((a) => a.userId === mid)?.decision !== "APPROVED"
  );
  if (notYetSigned.length > 0) {
    return NextResponse.json({ error: "รอกรรมการลำดับก่อนหน้าลงนามและอัปโหลดก่อน" }, { status: 400 });
  }

  const now = new Date();
  const newActions = [...prevActions, { userId, name: userName, decision, notes, actedAt: now.toISOString() }];

  if (decision === "REJECTED") {
    // Go back one step — same behaviour as the regular reject action
    const prevStep = [...sub.workflowSteps]
      .filter((s: any) => s.stepOrder < step.stepOrder)
      .sort((a: any, b: any) => b.stepOrder - a.stepOrder)[0];

    if (!prevStep) {
      return NextResponse.json({ error: "ไม่สามารถส่งกลับได้ — นี่คือขั้นตอนแรก" }, { status: 400 });
    }

    await prisma.workflowStep.updateMany({
      where: { id: { in: [step.id, prevStep.id] } },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id: submissionId }, data: { status: "IN_PROGRESS" } });

    const rejectionNote = notes
      ? `กรรมการส่งกลับเพื่อแก้ไข — "${notes}"`
      : `ส่งกลับโดย ${userName}`;
    // Notify role being sent back to
    let prevRecipientId: string | null = null;
    if (prevStep.role === "STUDENT")              prevRecipientId = sub.studentId;
    else if (prevStep.role === "ADVISOR")          prevRecipientId = (sub as any).advisorId ?? null;
    else if (prevStep.role === "HEAD_EXAM_COMMITTEE") prevRecipientId = (sub as any).headCommitteeId ?? null;
    else {
      const u = await prisma.user.findFirst({ where: { role: prevStep.role as any } });
      prevRecipientId = u?.id ?? null;
    }
    if (prevRecipientId) {
      await prisma.notification.create({
        data: { recipientId: prevRecipientId, message: rejectionNote, detail: sub.title, submissionId, type: "rejected" },
      });
    }
    try {
      const prevStepName = getStepName(prevStep.stepOrder, sub.submissionType) || ROLE_LABELS[prevStep.role as keyof typeof ROLE_LABELS];
      await sendStepEmail({ role: prevStep.role, sub, stepName: prevStepName });
    } catch (e) { console.error("[email/reject/committee]", e); }
    if (prevStep.role !== "STUDENT") {
      await prisma.notification.create({
        data: { recipientId: sub.studentId, message: rejectionNote, detail: sub.title, submissionId, type: "rejected" },
      });
    }
  } else {
    const allApproved = (step.committeeMembers as string[] ?? []).every(
      (mid) => newActions.find((a) => a.userId === mid)?.decision === "APPROVED"
    );

    if (!allApproved) {
      await prisma.workflowStep.update({ where: { id: step.id }, data: { committeeActions: newActions } });
    } else {
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: { status: "APPROVED", committeeActions: newActions, actedAt: now, actedByName: "กรรมการสอบครบทุกท่าน" },
      });
      const remaining = sub.workflowSteps.filter((s: any) => s.id !== step.id && s.status === "PENDING");
      const isComplete = remaining.length === 0;
      await prisma.submission.update({ where: { id: submissionId }, data: { status: isComplete ? "COMPLETED" : "IN_PROGRESS" } });

      if (isComplete) {
        await prisma.notification.create({
          data: { recipientId: sub.studentId, message: "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", detail: sub.title, submissionId, type: "approved" },
        });
      } else {
        const nextStep = sub.workflowSteps.find((s: any) => s.stepOrder > step.stepOrder && s.status === "PENDING");
        if (nextStep) {
          const stepName = getStepName(nextStep.stepOrder, sub.submissionType) || ROLE_LABELS[nextStep.role as keyof typeof ROLE_LABELS];
          const msg = `ถึงคิวของท่าน: ${stepName}`;
          let recipientId: string | null = nextStep.role === "ADVISOR" ? (sub as any).advisorId : null;
          if (!recipientId) {
            const u = await prisma.user.findFirst({ where: { role: nextStep.role as any } });
            recipientId = u?.id ?? null;
          }
          if (recipientId) {
            await prisma.notification.create({ data: { recipientId, message: msg, detail: sub.title, submissionId, type: "pending" } });
          }
          try { await sendStepEmail({ role: nextStep.role, sub, stepName }); } catch (e) { console.error("[email/step]", e); }
        }
      }
    }
  }

  const updated = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { workflowSteps: { orderBy: { stepOrder: "asc" } }, uploads: true },
  });
  return NextResponse.json(mapSub(updated));
}
