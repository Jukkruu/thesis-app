import { Resend } from "resend";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { ROLE_LABELS } from "./utils";
import { ROLE_ROUTES } from "./roleRoutes";
import type { Role } from "@/types";

function escapeHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


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
  /** For EXAM_COMMITTEE chain-sign: send email to only this specific member instead of all */
  specificMemberId?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
}

export async function sendStepEmail(options: StepEmailOptions): Promise<void> {
  const { role, sub, stepName } = options;
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
    } else if (role === "EXAM_COMMITTEE" || role === "CO_ADVISOR") {
      if (options.specificMemberId) {
        const u = await prisma.user.findUnique({ where: { id: options.specificMemberId } });
        if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
      } else {
        // Fallback: first member only
        const ids: string[] = role === "EXAM_COMMITTEE" ? (sub.committeeIds ?? []) : ((sub as any).coAdvisorIds ?? []);
        if (ids[0]) {
          const u = await prisma.user.findUnique({ where: { id: ids[0] } });
          if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
        }
      }
    } else if (role === "INVITED_EXAM_COMMITTEE" && sub.invitedCommitteeId) {
      const u = await prisma.user.findUnique({ where: { id: sub.invitedCommitteeId } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else if (role === "PROGRAM_CHAIR") {
      const u = await prisma.user.findFirst({ where: { isProgramChair: true } });
      if (u) recipients = [{ id: u.id, name: u.name, email: u.email }];
    } else {
      const u = await prisma.user.findFirst({ where: { roles: { has: role as any } } });
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

  // Map workflow step-role strings to actual dashboard paths.
  // ROLE_ROUTES only covers the 4 top-level DB roles (STUDENT/ADMIN/SUPER_ADMIN/PROFESSOR).
  const STEP_ROLE_DASHBOARD: Record<string, string> = {
    STUDENT:                "/dashboard/student",
    ADVISOR:                "/dashboard/advisor",
    CO_ADVISOR:             "/dashboard/advisor",
    HEAD_EXAM_COMMITTEE:    "/dashboard/head-exam-committee",
    EXAM_COMMITTEE:         "/dashboard/exam-committee",
    INVITED_EXAM_COMMITTEE: "/dashboard/invited-exam-committee",
    PROGRAM_CHAIR:          "/dashboard/program-chair",
    ADMIN:                  "/dashboard/admin",
    SUPER_ADMIN:            "/dashboard/super-admin",
  };
  const basePath = STEP_ROLE_DASHBOARD[role] ?? ROLE_ROUTES[role as Role] ?? "/dashboard";
  const redirectTo = `${basePath}/${sub.id}`;

  for (const recipient of recipients) {
    // Clean up any expired tokens for this user before creating a new one
    await prisma.magicToken.deleteMany({
      where: { userId: recipient.id, expiresAt: { lt: new Date() } },
    });

    // Magic token — one-time use, valid 48 hours
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
      to:   [recipient.email],
      subject: `[ระบบจัดการวิทยานิพนธ์] ${stepName} — ${sub.title}`,
      html: buildHtml(recipient.name, recipient.email, roleLabel, stepName, sub.title, studentDisplay, magicLink),
    });

    if (error) {
      console.error(`[email/step] Resend error for ${recipient.email}:`, JSON.stringify(error));
    } else {
      console.log(`[email/step] Sent to ${recipient.email}`);
    }
  }
}

function buildHtml(
  recipientName: string,
  recipientEmail: string,
  roleLabel: string,
  stepName: string,
  thesisTitle: string,
  studentName: string,
  magicLink: string,
): string {
  const rName   = escapeHtml(recipientName);
  const rEmail  = escapeHtml(recipientEmail);
  const rLabel  = escapeHtml(roleLabel);
  const sName   = escapeHtml(stepName);
  const tTitle  = escapeHtml(thesisTitle);
  const stName  = escapeHtml(studentName);
  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;">ระบบจัดการวิทยานิพนธ์</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
      </div>

      <p style="color:#374151;font-size:16px;">เรียน ${rName} <span style="color:#6b7280;font-size:14px;">(${rLabel})</span>,</p>
      <p style="color:#374151;">ขณะนี้ถึงขั้นตอนที่ต้องการการดำเนินการจากท่าน กรุณาคลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบและดำเนินการได้ทันที</p>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-weight:700;color:#1e40af;font-size:13px;">ขั้นตอนที่ต้องดำเนินการ</p>
        <p style="margin:0;color:#1d4ed8;font-size:16px;font-weight:600;">${sName}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ชื่อนิสิต</td>
          <td style="padding:10px 14px;color:#111827;">${stName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;">ชื่อวิทยานิพนธ์</td>
          <td style="padding:10px 14px;color:#111827;">${tTitle}</td>
        </tr>
        <tr style="background:#f3f4f6;">
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;">เข้าสู่ระบบในฐานะ</td>
          <td style="padding:10px 14px;color:#111827;">${rName} (${rEmail})</td>
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

// ─── Welcome email (sent on registration) ─────────────────────────────────────

export interface WelcomeEmailData {
  userId: string;
  name: string;
  email: string;
  password: string;
  role?: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log("[email/welcome] RESEND_API_KEY not set — skipping");
    return;
  }

  await prisma.magicToken.deleteMany({
    where: { userId: data.userId, expiresAt: { lt: new Date() } },
  });

  const redirectTo = ROLE_ROUTES[data.role as Role] ?? "/dashboard/student";
  const rawToken = randomBytes(32).toString("hex");
  await prisma.magicToken.create({
    data: {
      token: rawToken,
      userId: data.userId,
      redirectTo,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const loginLink = `${getAppUrl()}/api/auth/magic?t=${rawToken}`;
  const { error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [data.email],
    subject: "[ระบบจัดการวิทยานิพนธ์] ยินดีต้อนรับ — รหัสผ่านสำหรับเข้าสู่ระบบ",
    html: buildWelcomeHtml(data.name, data.email, data.password, loginLink),
  });

  if (error) {
    console.error(`[email/welcome] Resend error for ${data.email}:`, JSON.stringify(error));
  } else {
    console.log(`[email/welcome] Sent to ${data.email}`);
  }
}

function buildWelcomeHtml(name: string, email: string, password: string, loginLink: string): string {
  const rName  = escapeHtml(name);
  const rEmail = escapeHtml(email);
  const rPass  = escapeHtml(password);
  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;">ระบบจัดการวิทยานิพนธ์</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
      </div>

      <p style="color:#374151;font-size:16px;">ยินดีต้อนรับ ${rName}!</p>
      <p style="color:#374151;">บัญชีของคุณในระบบจัดการวิทยานิพนธ์ถูกสร้างเรียบร้อยแล้ว กรุณาบันทึกข้อมูลด้านล่างเพื่อใช้เข้าสู่ระบบในครั้งถัดไป</p>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#166534;font-size:13px;">ข้อมูลบัญชีของคุณ</p>
        <p style="margin:0 0 6px;color:#374151;font-size:15px;"><strong>อีเมล:</strong> ${rEmail}</p>
        <p style="margin:0;color:#374151;font-size:15px;"><strong>รหัสผ่าน:</strong> <code style="background:#e5e7eb;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:15px;letter-spacing:0.05em;">${rPass}</code></p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${loginLink}"
           style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;">
          คลิกเพื่อเข้าสู่ระบบทันที
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
          ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 48 ชั่วโมง<br>
          หลังจากนั้นให้ใช้อีเมลและรหัสผ่านด้านบนเพื่อเข้าสู่ระบบ
        </p>
      </div>

      <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
        อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
        กรุณาอย่าตอบกลับอีเมลนี้
      </p>
    </div>
  `;
}

// ─── Forgot-password email ─────────────────────────────────────────────────────

export interface ForgotPasswordEmailData {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export async function sendForgotPasswordEmail(data: ForgotPasswordEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log("[email/forgot-pw] RESEND_API_KEY not set — skipping");
    return;
  }

  await prisma.magicToken.deleteMany({
    where: { userId: data.userId, expiresAt: { lt: new Date() } },
  });

  const rawToken = randomBytes(32).toString("hex");
  const redirectTo = ROLE_ROUTES[data.role as Role] ?? "/dashboard";
  await prisma.magicToken.create({
    data: {
      token: rawToken,
      userId: data.userId,
      redirectTo,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const loginLink = `${getAppUrl()}/api/auth/magic?t=${rawToken}`;
  const { error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [data.email],
    subject: "[ระบบจัดการวิทยานิพนธ์] รหัสผ่านใหม่ของคุณ",
    html: buildForgotPasswordHtml(data.name, data.email, data.password, loginLink),
  });

  if (error) {
    console.error(`[email/forgot-pw] Resend error for ${data.email}:`, JSON.stringify(error));
  } else {
    console.log(`[email/forgot-pw] Sent to ${data.email}`);
  }
}

function buildForgotPasswordHtml(name: string, email: string, password: string, loginLink: string): string {
  const rName  = escapeHtml(name);
  const rEmail = escapeHtml(email);
  const rPass  = escapeHtml(password);
  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;">ระบบจัดการวิทยานิพนธ์</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
      </div>

      <p style="color:#374151;font-size:16px;">เรียน ${rName},</p>
      <p style="color:#374151;">มีการขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ รหัสผ่านใหม่ของคุณคือ:</p>

      <div style="background:#fefce8;border-left:4px solid #eab308;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#713f12;font-size:13px;">รหัสผ่านใหม่</p>
        <p style="margin:0 0 6px;color:#374151;font-size:15px;"><strong>อีเมล:</strong> ${rEmail}</p>
        <p style="margin:0;color:#374151;font-size:15px;"><strong>รหัสผ่านใหม่:</strong> <code style="background:#e5e7eb;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:15px;letter-spacing:0.05em;">${rPass}</code></p>
      </div>

      <p style="color:#6b7280;font-size:14px;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบทันที</p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${loginLink}"
           style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;">
          คลิกเพื่อเข้าสู่ระบบทันที
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:12px;">
          ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 48 ชั่วโมง<br>
          หลังจากนั้นให้ใช้อีเมลและรหัสผ่านใหม่ด้านบนเพื่อเข้าสู่ระบบ
        </p>
      </div>

      <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
        อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
        กรุณาอย่าตอบกลับอีเมลนี้
      </p>
    </div>
  `;
}

// ─── Finance email ─────────────────────────────────────────────────────────────

export interface FinanceEmailData {
  studentName: string;
  studentCode: string;
  studentEmail?: string;
  studentPhone?: string;
  program: string;
  thesisTitle: string;
  submissionId: string;
  advisorName?: string;
  headCommitteeName?: string;
  committeeNames?: string[];
  invitedProfName?: string;
  invitedProfAffiliation?: string;
  invitedProfEmail?: string;
  invitedProfPhone?: string;
  examDate?: string;
  examTime?: string;
  roomNeeded?: boolean;
  parkingNeeded?: boolean;
  carPlate?: string;
}

export async function sendFinanceEmail(data: FinanceEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log("[email/finance] RESEND_API_KEY not set — skipping");
    return;
  }

  const financeEmail = process.env.FINANCE_EMAIL ?? "outanagon2549@gmail.com";
  const {
    studentName, studentCode, studentEmail, studentPhone,
    program, thesisTitle, submissionId,
    advisorName, headCommitteeName, committeeNames,
    invitedProfName, invitedProfAffiliation, invitedProfEmail, invitedProfPhone,
    examDate, examTime, roomNeeded, parkingNeeded, carPlate,
  } = data;

  const committeeRows = [
    headCommitteeName ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ประธานกรรมการสอบ</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(headCommitteeName)}</td></tr>` : "",
    ...(committeeNames ?? []).map((name, i) =>
      `<tr style="${i % 2 === 0 ? "background:#f9fafb;" : ""}"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">กรรมการสอบ ${i + 1}</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(name)}</td></tr>`
    ),
    invitedProfName ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;">กรรมการภายนอก</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(invitedProfName)}${invitedProfAffiliation ? ` (${escapeHtml(invitedProfAffiliation)})` : ""}${invitedProfEmail ? `<br><span style="color:#6b7280;font-size:13px;">📧 ${escapeHtml(invitedProfEmail)}</span>` : ""}${invitedProfPhone ? `<br><span style="color:#6b7280;font-size:13px;">📞 ${escapeHtml(invitedProfPhone)}</span>` : ""}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  const { error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [financeEmail],
    subject: `[แจ้งการเงิน] นิสิตยื่นเสนอหัวข้อวิทยานิพนธ์ — ${escapeHtml(studentName)}`,
    html: `
      <div style="font-family:'Sarabun',sans-serif;max-width:640px;margin:0 auto;padding:24px;">
        <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
          <h1 style="margin:0;font-size:20px;">ระบบจัดการวิทยานิพนธ์</h1>
          <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
        </div>

        <p style="color:#374151;font-size:16px;">เรียน ฝ่ายการเงิน,</p>
        <p style="color:#374151;">นิสิตรายการด้านล่างได้ยื่นเสนอหัวข้อวิทยานิพนธ์และผ่านการอนุมัติขั้นตอนที่ 1 เรียบร้อยแล้ว กรุณาดำเนินการในส่วนที่เกี่ยวข้อง</p>

        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">ข้อมูลนิสิต</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ชื่อ-นามสกุล</td>
            <td style="padding:10px 14px;color:#111827;">${escapeHtml(studentName)}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">รหัสนิสิต</td>
            <td style="padding:10px 14px;color:#111827;">${escapeHtml(studentCode)}</td>
          </tr>
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">หลักสูตร</td>
            <td style="padding:10px 14px;color:#111827;">${escapeHtml(program)}</td>
          </tr>
          ${studentEmail ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;">อีเมล</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(studentEmail)}</td></tr>` : ""}
          ${studentPhone ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">เบอร์โทร</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(studentPhone)}</td></tr>` : ""}
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">ชื่อวิทยานิพนธ์</td>
            <td style="padding:10px 14px;color:#111827;">${escapeHtml(thesisTitle)}</td>
          </tr>
        </table>

        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">อาจารย์ที่ปรึกษาและกรรมการสอบ</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${advisorName ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">อาจารย์ที่ปรึกษา</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(advisorName)}</td></tr>` : ""}
          ${committeeRows}
        </table>

        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">ข้อมูลการสอบ</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${examDate ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">วันที่สอบ</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(examDate)}${examTime ? ` เวลา ${escapeHtml(examTime)} น.` : ""}</td></tr>` : ""}
          <tr${examDate ? "" : ' style="background:#f3f4f6;"'}><td style="padding:10px 14px;font-weight:600;color:#6b7280;">ห้องประชุม</td><td style="padding:10px 14px;color:#111827;">${roomNeeded ? "✅ ต้องการห้องประชุม" : "ไม่ต้องการ"}</td></tr>
          ${parkingNeeded ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">ที่จอดรถ (ทะเบียน)</td><td style="padding:10px 14px;color:#111827;">${escapeHtml(carPlate) ?? "-"}</td></tr>` : ""}
        </table>

        <p style="color:#6b7280;font-size:12px;margin-top:8px;">รหัสคำร้อง: ${escapeHtml(submissionId)}</p>

        <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
          อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
          กรุณาอย่าตอบกลับอีเมลนี้
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email/finance] Resend error:", JSON.stringify(error));
    throw new Error("Finance email failed");
  }
  console.log("[email/finance] Sent to:", financeEmail);
}

// ─── Exam reminder email (sent by cron 14 / 7 days before exam) ───────────────

export interface ExamReminderEmailData {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  submissionId: string;
  thesisTitle: string;
  studentDisplay: string;
  examDate: string;
  examTime?: string | null;
  daysUntil: 14 | 7;
  redirectTo: string;
}

export async function sendExamReminderEmail(data: ExamReminderEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log("[email/exam-reminder] RESEND_API_KEY not set — skipping");
    return;
  }

  await prisma.magicToken.deleteMany({
    where: { userId: data.recipientId, expiresAt: { lt: new Date() } },
  });

  const rawToken = randomBytes(32).toString("hex");
  await prisma.magicToken.create({
    data: {
      token: rawToken,
      userId: data.recipientId,
      redirectTo: data.redirectTo,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const magicLink = `${getAppUrl()}/api/auth/magic?t=${rawToken}`;
  const is7 = data.daysUntil === 7;
  const subject = is7
    ? `[แจ้งเตือน] เหลือ 7 วันก่อนวันสอบ — ${data.thesisTitle}`
    : `[แจ้งเตือน] วันสอบอีก 14 วัน — ${data.thesisTitle}`;

  const { error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [data.recipientEmail],
    subject,
    html: buildExamReminderHtml(data, magicLink),
  });

  if (error) {
    console.error(`[email/exam-reminder] Resend error for ${data.recipientEmail}:`, JSON.stringify(error));
  } else {
    console.log(`[email/exam-reminder] Sent to ${data.recipientEmail}`);
  }
}

function buildExamReminderHtml(data: ExamReminderEmailData, magicLink: string): string {
  const is7    = data.daysUntil === 7;
  const rName  = escapeHtml(data.recipientName);
  const tTitle = escapeHtml(data.thesisTitle);
  const stName = escapeHtml(data.studentDisplay);
  const eDate  = escapeHtml(data.examDate);
  const eTime  = data.examTime ? escapeHtml(data.examTime) : null;

  const headerGrad  = is7 ? "#dc2626,#b91c1c" : "#d97706,#b45309";
  const accentColor = is7 ? "#dc2626"          : "#d97706";
  const borderColor = is7 ? "#dc2626"          : "#f59e0b";
  const bgColor     = is7 ? "#fef2f2"          : "#fffbeb";
  const mainText    = is7
    ? "เหลือเวลาอีก <strong>7 วัน</strong> ก่อนวันสอบ <strong>ทุกขั้นตอนต้องเสร็จสิ้นก่อนวันสอบ</strong> กรุณาดำเนินการให้แล้วเสร็จโดยด่วน"
    : "วันสอบของคุณ<strong>อีก 14 วัน</strong> กรุณาตรวจสอบสถานะขั้นตอนและความพร้อมก่อนวันสอบ";

  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,${headerGrad});border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;">⏰ แจ้งเตือนวันสอบ</h1>
        <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
      </div>

      <p style="color:#374151;font-size:16px;">เรียน ${rName},</p>
      <p style="color:#374151;">${mainText}</p>

      <div style="background:${bgColor};border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-weight:700;color:${accentColor};font-size:13px;">วันที่สอบ</p>
        <p style="margin:0;color:#111827;font-size:20px;font-weight:700;">${eDate}${eTime ? ` เวลา ${eTime} น.` : ""}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ชื่อนิสิต</td>
          <td style="padding:10px 14px;color:#111827;">${stName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#6b7280;">ชื่อวิทยานิพนธ์</td>
          <td style="padding:10px 14px;color:#111827;">${tTitle}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:28px 0;">
        <a href="${magicLink}"
           style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;">
          คลิกเพื่อเข้าสู่ระบบและตรวจสอบสถานะ
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
