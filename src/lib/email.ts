import { Resend } from "resend";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { ROLE_LABELS } from "./utils";
import { ROLE_ROUTES } from "./roleRoutes";
import type { Role } from "@/types";

// All emails go here while testing; swap to recipient.email when going live
const DEV_EMAIL_OVERRIDE = "outanagon2549@gmail.com";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getAppUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

interface StepEmailOptions {
  role: string;
  sub: {
    id: string;
    title: string;
    studentId?: string | null;
    studentFullName?: string | null;
    studentCode?: string | null;
    advisorId?: string | null;
    headCommitteeId?: string | null;
    committeeIds?: string[];
    invitedCommitteeId?: string | null;
  };
  stepName: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
}

export async function sendStepEmail({ role, sub, stepName }: StepEmailOptions): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log("[email/step] RESEND_API_KEY not set — skipping");
    return;
  }

  let recipients: Recipient[] = [];

  try {
    if (role === "STUDENT" && sub.studentId) {
      const u = await prisma.user.findUnique({ where: { id: sub.studentId } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else if (role === "ADVISOR" && sub.advisorId) {
      const u = await prisma.user.findUnique({ where: { id: sub.advisorId } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else if (role === "HEAD_EXAM_COMMITTEE" && sub.headCommitteeId) {
      const u = await prisma.user.findUnique({ where: { id: sub.headCommitteeId } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else if (role === "EXAM_COMMITTEE" && sub.committeeIds?.length) {
      const users = await prisma.user.findMany({ where: { id: { in: sub.committeeIds } } });
      recipients = users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
    } else if (role === "INVITED_EXAM_COMMITTEE" && sub.invitedCommitteeId) {
      const u = await prisma.user.findUnique({ where: { id: sub.invitedCommitteeId } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else {
      const u = await prisma.user.findFirst({ where: { role: role as any } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    }
  } catch (e) {
    console.error("[email/step] Error looking up recipients:", e);
    return;
  }

  if (!recipients.length) {
    console.log(`[email/step] No recipients found for role ${role}`);
    return;
  }

  const studentDisplay = sub.studentFullName ?? (sub.studentCode ? `รหัส ${sub.studentCode}` : "นิสิต");
  const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
  const basePath = ROLE_ROUTES[role as Role] ?? "/dashboard";
  const redirectTo = `${basePath}/${sub.id}`;

  for (const recipient of recipients) {
    // One-time magic token — valid 48 hours
    const rawToken = randomBytes(32).toString("hex");
    await prisma.magicToken.create({
      data: {
        token:     rawToken,
        userId:    recipient.id,
        redirectTo,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    const magicLink = `${getAppUrl()}/api/auth/magic?t=${rawToken}`;

    const { error } = await resend.emails.send({
      from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
      to:   [DEV_EMAIL_OVERRIDE],
      subject: `[ถึงคิวของท่าน] ${stepName} — ${sub.title}`,
      html: buildHtml(recipient.name, roleLabel, stepName, sub.title, studentDisplay, magicLink),
    });

    if (error) {
      console.error(`[email/step] Resend error (intended: ${recipient.email}):`, JSON.stringify(error));
    } else {
      console.log(`[email/step] Sent to ${DEV_EMAIL_OVERRIDE} (intended: ${recipient.email})`);
    }
  }
}

function buildHtml(
  recipientName: string,
  roleLabel: string,
  stepName: string,
  thesisTitle: string,
  studentName: string,
  magicLink: string,
): string {
  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;">🔔 ถึงคิวดำเนินการของท่าน</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
      </div>

      <p style="color:#374151;font-size:16px;">เรียน ${recipientName} <span style="color:#6b7280;font-size:14px;">(${roleLabel})</span>,</p>
      <p style="color:#374151;">ขณะนี้ถึงขั้นตอนที่ต้องการการดำเนินการจากท่าน กรุณาคลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบและดำเนินการได้ทันที</p>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-weight:700;color:#1e40af;font-size:13px;">ขั้นตอนที่ต้องดำเนินการ</p>
        <p style="margin:0;color:#1d4ed8;font-size:16px;font-weight:600;">${stepName}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ชื่อนิสิต</td>
          <td style="padding:10px 14px;color:#111827;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;">ชื่อวิทยานิพนธ์</td>
          <td style="padding:10px 14px;color:#111827;">${thesisTitle}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:28px 0;">
        <a href="${magicLink}"
           style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;">
          คลิกเพื่อเข้าสู่ระบบและดูคำร้อง
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:12px;">ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 48 ชั่วโมง</p>
      </div>

      <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
        อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
        กรุณาอย่าตอบกลับอีเมลนี้
      </p>
    </div>
  `;
}
