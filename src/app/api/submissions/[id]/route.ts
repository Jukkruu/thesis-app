import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStepName, ROLE_LABELS, PROGRAM_LABELS } from "@/lib/utils";
import { sendStepEmail, sendFinanceEmail } from "@/lib/email";

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
    const firstId: string | undefined = sub.committeeIds?.[0];
    if (firstId) {
      await prisma.notification.create({
        data: { recipientId: firstId, message, detail: sub.title, submissionId: sub.id, type },
      });
    }
    return;
  } else if (role === "CO_ADVISOR") {
    const firstId: string | undefined = sub.coAdvisorIds?.[0];
    if (firstId) {
      await prisma.notification.create({
        data: { recipientId: firstId, message, detail: sub.title, submissionId: sub.id, type },
      });
    }
    return;
  } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
    // Fix #3: notify ALL admins, not just the first one found
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a: any) => ({ recipientId: a.id, message, detail: sub.title, submissionId: sub.id, type })),
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

  const { id: userId, role } = session.user;
  const isPrivileged = ["ADMIN", "SUPER_ADMIN", "PROGRAM_CHAIR"].includes(role);
  const isInvolved =
    sub.studentId === userId ||
    sub.advisorId === userId ||
    (sub.coAdvisorIds as string[]).includes(userId) ||
    (sub.committeeIds as string[]).includes(userId) ||
    sub.headCommitteeId === userId ||
    sub.invitedCommitteeId === userId;
  if (!isPrivileged && !isInvolved)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(mapSub(sub));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;
  const { id: userId, name: userName } = session.user;

  // Always look up role from DB — JWT role can be stale after a role change
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const role: string = dbUser?.role ?? (session.user.role as string);

  const sub = await getSub(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  if (action === "approve") {
    // Block approval while submission is REJECTED — student must resubmit to reset the rejected step
    if (sub.status === "REJECTED")
      return NextResponse.json({ error: "คำร้องถูกปฏิเสธ — รอนักศึกษายืนยันการแก้ไขก่อน" }, { status: 400 });

    const step = sub.workflowSteps.find((s: any) => s.status === "PENDING");
    if (!step) return NextResponse.json({ error: "No pending step" }, { status: 400 });
    if (step.role !== role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // For STUDENT steps, only the submission's own student can advance
    if (step.role === "STUDENT" && sub.studentId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Enforce required uploads before certain steps can advance
    {
      // PROPOSAL step 4: student and admin upload in parallel — only student docs required here;
      // FINANCE_DOC is checked separately and auto-advances the step when both sides are ready.
      const REQUIRED_UPLOADS: Record<string, Record<number, string[]>> = {
        PROPOSAL:       { 1: ["BW1A", "BW1B"], 4: ["B1C", "B1D"] },
        THESIS_DEFENSE: { 1: ["B2", "B3"], 9: ["SIGNED"], 16: ["B4", "THESIS"] },
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
      // PROPOSAL step 4 parallel gate: student docs are ready — check if FINANCE_DOC is also done.
      // If not, acknowledge the student's submission, notify admin, and keep the step PENDING.
      if ((sub.submissionType ?? "PROPOSAL") === "PROPOSAL" && step.stepOrder === 4) {
        if (!uploaded.has("FINANCE_DOC")) {
          // Notify all admins to upload their FINANCE_DOC
          const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
          if (admins.length) {
            await prisma.notification.createMany({
              data: admins.map((a: any) => ({
                recipientId: a.id,
                message: "นิสิตอัปโหลด บ.วศ.1ค + บ.วศ.1ง แล้ว — กรุณาอัปโหลดเอกสารการเงิน",
                detail: sub.title,
                submissionId: sub.id,
                type: "pending",
              })),
            });
          }
          try {
            await sendStepEmail({ role: "ADMIN", sub, stepName: "อัปโหลดเอกสารการเงิน (ขั้นที่ 4)" });
          } catch (e) { console.error("[email/step4-finance]", e); }
          const result = await getSub(id);
          return NextResponse.json({ ...mapSub(result!), waitingForFinance: true });
        }
      }
    }

    // THESIS step 8 (ADMIN upload step): require at least one SIGNED doc uploaded AFTER step 7 completed
    if (sub.submissionType === "THESIS_DEFENSE" && step.stepOrder === 8 && step.role === "ADMIN") {
      const step7 = sub.workflowSteps.find((s: any) => s.stepOrder === 7);
      const step7ActedAt = step7?.actedAt ? new Date(step7.actedAt).getTime() : 0;
      const hasSigned = sub.uploads.some(
        (u: any) => u.formType === "SIGNED" && new Date(u.uploadedAt).getTime() >= step7ActedAt
      );
      if (!hasSigned) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดเอกสารจากคณะอย่างน้อย 1 ไฟล์ก่อนอนุมัติ" },
          { status: 400 }
        );
      }
    }

    // THESIS step 9 (STUDENT แบบรายงานฯ): require a SIGNED uploaded AFTER step 8 completed.
    // Admin uploads SIGNED at step 8 — without this gate the general check above would pass
    // on the admin's upload, letting the student skip their own signed document entirely.
    if (sub.submissionType === "THESIS_DEFENSE" && step.stepOrder === 9 && step.role === "STUDENT") {
      const step8 = sub.workflowSteps.find((s: any) => s.stepOrder === 8);
      const step8ActedAt = step8?.actedAt ? new Date(step8.actedAt).getTime() : 0;
      const hasStudentSigned = sub.uploads.some(
        (u: any) => u.formType === "SIGNED" && new Date(u.uploadedAt).getTime() > step8ActedAt
      );
      if (!hasStudentSigned) {
        return NextResponse.json(
          { error: "กรุณาอัปโหลดแบบรายงานการเสนอผลงานฯ ที่ลงนามโดยนิสิตก่อน" },
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
      // Notify all admins when PROPOSAL fully completes
      if (sub.submissionType === "PROPOSAL") {
        const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
        if (adminUsers.length) {
          await prisma.notification.createMany({
            data: adminUsers.map((a) => ({ recipientId: a.id, message: "กระบวนการ Proposal เสร็จสมบูรณ์แล้ว", detail: sub.title, submissionId: id, type: "approved" })),
          });
          try { await sendStepEmail({ role: "ADMIN", sub, stepName: "Proposal เสร็จสมบูรณ์" }); } catch (e) { console.error("[email/proposal-complete]", e); }
        }
      }
    } else {
      const nextStep = sub.workflowSteps.find((s: any) => s.stepOrder > step.stepOrder && s.status === "PENDING");
      if (nextStep) {
        const stepName = getStepName(nextStep.stepOrder, sub.submissionType) || ROLE_LABELS[nextStep.role as keyof typeof ROLE_LABELS];
        const msg = `ถึงคิวของท่าน: ${stepName}`;
        await notifyRole(nextStep.role, sub, msg, "pending");
        try {
          const specificMemberId = nextStep.role === "EXAM_COMMITTEE" ? (sub.committeeIds as string[])?.[0]
            : nextStep.role === "CO_ADVISOR" ? (sub.coAdvisorIds as string[])?.[0]
            : undefined;
          await sendStepEmail({ role: nextStep.role, sub, stepName, specificMemberId });
        } catch (e) { console.error("[email/step]", e); }
      }
      // Notify student that their submission has progressed (unless it was their own step)
      if (step.role !== "STUDENT") {
        const actorLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
        const currentStepName = getStepName(step.stepOrder, sub.submissionType) || actorLabel;
        await prisma.notification.create({
          data: { recipientId: sub.studentId, message: `คำร้องคืบหน้า — ${actorLabel}อนุมัติ: ${currentStepName}`, detail: sub.title, submissionId: id, type: "info" },
        });
      }
      // After THESIS step 6 (PROGRAM_CHAIR sign B2), notify all admins to collect + send to Faculty
      if (step.stepOrder === 6 && step.role === "PROGRAM_CHAIR" && sub.submissionType === "THESIS_DEFENSE") {
        try {
          const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
          if (adminUsers.length) {
            await prisma.notification.createMany({
              data: adminUsers.map((a) => ({ recipientId: a.id, message: "บ.2 + บ.3 ลงนามครบแล้ว — กรุณานำส่งไปยังคณะ", detail: sub.title, submissionId: id, type: "info" })),
            });
            await sendStepEmail({ role: "ADMIN", sub, stepName: "นำส่ง บ.2+บ.3 ไปคณะ" });
          }
        } catch (e) { console.error("[email/thesis/step5]", e); }
      }
      // After THESIS step 8 (ADMIN upload), send invitation letter email to Advisor + External
      if (step.stepOrder === 8 && step.role === "ADMIN" && sub.submissionType === "THESIS_DEFENSE") {
        try {
          if (sub.advisorId) {
            await sendStepEmail({ role: "ADVISOR", sub, stepName: "หนังสือเชิญเข้าร่วมสอบวิทยานิพนธ์" });
          }
          if (sub.invitedCommitteeId) {
            await sendStepEmail({ role: "INVITED_EXAM_COMMITTEE", sub, stepName: "หนังสือเชิญเข้าร่วมสอบวิทยานิพนธ์" });
          }
        } catch (e) { console.error("[email/invitation]", e); }
      }
    }

    if (step.stepOrder === 3 && step.role === "PROGRAM_CHAIR" && sub.submissionType === "PROPOSAL") {
      try {
        const invitedId = (sub as any).invitedCommitteeId as string | null | undefined;
        const [advisorUser, headUser, committeeUsers, invitedUser] = await Promise.all([
          sub.advisorId ? prisma.user.findUnique({ where: { id: sub.advisorId }, select: { name: true } }) : null,
          sub.headCommitteeId ? prisma.user.findUnique({ where: { id: sub.headCommitteeId }, select: { name: true } }) : null,
          (sub.committeeIds as string[] | undefined)?.length
            ? prisma.user.findMany({ where: { id: { in: sub.committeeIds as string[] } }, select: { name: true } })
            : Promise.resolve([]),
          invitedId ? prisma.user.findUnique({ where: { id: invitedId }, select: { name: true, email: true } }) : null,
        ]);
        await sendFinanceEmail({
          studentName: sub.studentFullName ?? sub.studentId ?? "-",
          studentCode: sub.studentCode ?? "-",
          studentEmail: sub.studentEmail ?? undefined,
          studentPhone: sub.studentPhone ?? undefined,
          program: sub.program ? (PROGRAM_LABELS[sub.program] ?? sub.program) : "-",
          thesisTitle: sub.title,
          submissionId: id,
          advisorName: advisorUser?.name,
          headCommitteeName: headUser?.name,
          committeeNames: (committeeUsers as { name: string }[]).map((u) => u.name),
          invitedProfName: (sub as any).invitedProfName ?? invitedUser?.name,
          invitedProfAffiliation: (sub as any).invitedProfAffiliation,
          invitedProfEmail: (sub as any).invitedProfEmail ?? invitedUser?.email,
          invitedProfPhone: (sub as any).invitedProfPhone,
          examDate: (sub as any).examDate,
          examTime: (sub as any).examTime,
          roomNeeded: (sub as any).roomNeeded,
          parkingNeeded: (sub as any).parkingNeeded,
          carPlate: (sub as any).carPlate,
        });
        // Notify all admins that finance email was sent
        const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
        if (adminUsers.length) {
          await prisma.notification.createMany({
            data: adminUsers.map((a) => ({ recipientId: a.id, message: "ส่งอีเมลแจ้งฝ่ายการเงินแล้ว", detail: sub.title, submissionId: id, type: "info" })),
          });
        }
      } catch (e) {
        console.error("[email/finance]", e);
      }
    }
  }

  else if (action === "reject") {
    // Block rejection while submission is already REJECTED — a second reject would create two
    // REJECTED steps; resubmit only resets one of them, leaving the other permanently orphaned.
    if (sub.status === "REJECTED")
      return NextResponse.json({ error: "คำร้องถูกปฏิเสธ — รอนักศึกษายืนยันการแก้ไขก่อน" }, { status: 400 });

    const step = sub.workflowSteps.find((s: any) => s.status === "PENDING");
    if (!step) return NextResponse.json({ error: "No pending step" }, { status: 400 });

    const byLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
    const rejectionNote = body.notes
      ? `ส่งกลับเพื่อแก้ไข — "${body.notes}"`
      : `ส่งกลับโดย ${byLabel}`;

    const isPrivileged = role === "ADMIN" || role === "SUPER_ADMIN";

    // Non-privileged users must be involved in this submission to reject
    if (!isPrivileged) {
      const isInvolved =
        sub.studentId === userId ||
        sub.advisorId === userId ||
        (sub.coAdvisorIds as string[]).includes(userId) ||
        (sub.committeeIds as string[]).includes(userId) ||
        sub.headCommitteeId === userId ||
        sub.invitedCommitteeId === userId;
      if (!isInvolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // All roles go back exactly one step — skip SKIPPED steps (e.g. CO_ADVISOR when no co-advisors)
    const prevStep = [...sub.workflowSteps]
      .filter((s: any) => s.stepOrder < step.stepOrder && s.status !== "SKIPPED")
      .sort((a: any, b: any) => b.stepOrder - a.stepOrder)[0];

    if (!prevStep) {
      return NextResponse.json({ error: "ไม่สามารถส่งกลับได้ — นี่คือขั้นตอนแรก" }, { status: 400 });
    }

    // Mark current step REJECTED, reset prev step so that role can act again
    await prisma.workflowStep.update({
      where: { id: step.id },
      data: { status: "REJECTED", actedAt: now, actedByName: userName, actedById: userId, notes: rejectionNote },
    });
    await prisma.workflowStep.update({
      where: { id: prevStep.id },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id }, data: { status: "REJECTED" } });

    // Notify the role being sent back to
    await notifyRole(prevStep.role, sub, rejectionNote, "rejected");
    try {
      const prevStepName = getStepName(prevStep.stepOrder, sub.submissionType) || ROLE_LABELS[prevStep.role as keyof typeof ROLE_LABELS];
      await sendStepEmail({ role: prevStep.role, sub, stepName: prevStepName });
    } catch (e) { console.error("[email/reject]", e); }

    // Notify student if the step being sent back to is not their own step
    if (prevStep.role !== "STUDENT") {
      const studentNote = body.notes
        ? `คำร้องถูกส่งกลับ — "${body.notes}"`
        : `คำร้องถูกส่งกลับขั้นตอนก่อนหน้าโดย ${byLabel}`;
      await prisma.notification.create({
        data: { recipientId: sub.studentId, message: studentNote, detail: sub.title, submissionId: id, type: "rejected" },
      });
    }
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

    // Go back exactly one step from the rejected step — skip SKIPPED steps same as reject action.
    const prevStep = [...sub.workflowSteps]
      .filter((s: any) => s.stepOrder < rejectedStep.stepOrder && s.status !== "SKIPPED")
      .sort((a: any, b: any) => b.stepOrder - a.stepOrder)[0] ?? rejectedStep;

    // Reset only non-SKIPPED steps in the range — don't accidentally un-skip CO_ADVISOR etc.
    const idsToReset = sub.workflowSteps
      .filter((s: any) =>
        s.stepOrder >= prevStep.stepOrder &&
        s.stepOrder <= rejectedStep.stepOrder &&
        s.status !== "SKIPPED"
      )
      .map((s: any) => s.id);

    await prisma.workflowStep.updateMany({
      where: { id: { in: idsToReset } },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    await notifyRole(prevStep.role, sub, "กรุณาดำเนินการอีกครั้ง", "pending");
  }

  else if (action === "admin_set_note") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.submission.update({ where: { id }, data: { adminNote: body.note } });
  }

  else if (action === "admin_update") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.submission.update({
      where: { id },
      data: { title: body.title ?? undefined, advisorId: body.advisorId === undefined ? undefined : (body.advisorId || null) },
    });
  }

  else if (action === "admin_reset") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.workflowStep.updateMany({
      where: { submissionId: id, status: { not: "SKIPPED" } },
      data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
    });
    await prisma.submission.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  }

  else if (action === "admin_override_step") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { stepOrder, decision, notes } = body;

    const targetStep = sub.workflowSteps.find((s: any) => s.stepOrder === stepOrder);
    if (!targetStep) return NextResponse.json({ error: "Step not found" }, { status: 404 });

    if (decision === "APPROVED") {
      // Approve target + all non-SKIPPED steps before it that aren't already APPROVED
      const toApprove = sub.workflowSteps
        .filter((s: any) => s.stepOrder <= stepOrder && s.status !== "SKIPPED" && s.status !== "APPROVED")
        .map((s: any) => s.id);
      if (toApprove.length > 0) {
        await prisma.workflowStep.updateMany({
          where: { id: { in: toApprove } },
          data: { status: "APPROVED", actedAt: now, actedByName: userName, actedById: userId, notes: notes ?? null },
        });
      }
    } else if (decision === "REJECTED") {
      // Reset target + all non-SKIPPED steps after it to PENDING
      const toReset = sub.workflowSteps
        .filter((s: any) => s.stepOrder >= stepOrder && s.status !== "SKIPPED")
        .map((s: any) => s.id);
      if (toReset.length > 0) {
        await prisma.workflowStep.updateMany({
          where: { id: { in: toReset } },
          data: { status: "PENDING", actedAt: null, actedByName: null, actedById: null, notes: null, committeeActions: [] },
        });
      }
    }

    const updatedSub = await getSub(id);
    if (updatedSub) {
      const hasPending  = updatedSub.workflowSteps.some((s: any) => s.status === "PENDING");
      const hasRejected = updatedSub.workflowSteps.some((s: any) => s.status === "REJECTED");
      await prisma.submission.update({ where: { id }, data: { status: hasPending ? "IN_PROGRESS" : hasRejected ? "REJECTED" : "COMPLETED" } });

      // Notify + email the responsible person of the first PENDING step after the override
      const nextPending = updatedSub.workflowSteps.find((s: any) => s.status === "PENDING");
      if (nextPending) {
        const stepName = getStepName(nextPending.stepOrder, sub.submissionType) || ROLE_LABELS[nextPending.role as keyof typeof ROLE_LABELS];
        const msg = decision === "APPROVED"
          ? `ถึงคิวของท่าน: ${stepName}`
          : `กรุณาดำเนินการอีกครั้ง: ${stepName}`;
        await notifyRole(nextPending.role, sub, msg, decision === "APPROVED" ? "pending" : "rejected");
        try {
          const specificMemberId = nextPending.role === "EXAM_COMMITTEE" ? (sub.committeeIds as string[])?.[0]
            : nextPending.role === "CO_ADVISOR" ? (sub.coAdvisorIds as string[])?.[0]
            : undefined;
          await sendStepEmail({ role: nextPending.role, sub, stepName, specificMemberId });
        } catch (e) { console.error("[email/override-next]", e); }
      }
      // Always notify student when admin overrides
      const overrideMsg = decision === "APPROVED"
        ? `ผู้ดูแลระบบอนุมัติขั้นตอนที่ ${stepOrder} แทน — คำร้องของท่านคืบหน้าแล้ว`
        : `ผู้ดูแลระบบรีเซตขั้นตอนที่ ${stepOrder} — กรุณาตรวจสอบคำร้องของท่าน`;
      await prisma.notification.create({
        data: { recipientId: sub.studentId, message: overrideMsg, detail: sub.title, submissionId: id, type: decision === "APPROVED" ? "info" : "rejected" },
      });
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
