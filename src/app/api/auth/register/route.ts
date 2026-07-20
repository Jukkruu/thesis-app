import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import { isValidEmail, isValidStudentId } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/rateLimit";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  // Unauthenticated endpoint — cap per-IP so account creation can't be scripted in bulk
  if (!(await rateLimit(`reg:${clientIp(req)}`, 10, 3600)))
    return NextResponse.json({ error: "มีการลงทะเบียนบ่อยเกินไป กรุณาลองใหม่ในอีก 1 ชั่วโมง" }, { status: 429 });

  const body = await req.json();
  const name: string = body.name ?? "";
  const email: string = body.email ?? "";
  const role: string = body.role === "PROFESSOR" ? "PROFESSOR" : "STUDENT";
  const studentId: string = (body.studentId ?? "").trim();

  if (!name.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
  if (!email.trim()) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
  if (!isValidEmail(email))
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" }, { status: 400 });
  if (role === "STUDENT" && !studentId)
    return NextResponse.json({ error: "กรุณากรอกรหัสนิสิต" }, { status: 400 });
  if (role === "STUDENT" && !isValidStudentId(studentId))
    return NextResponse.json({ error: "รหัสนิสิตต้องเป็นตัวเลข 10 หลัก" }, { status: 400 });
  if (name.trim().length > 200)
    return NextResponse.json({ error: "ชื่อ-นามสกุลยาวเกิน 200 ตัวอักษร" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 409 });

  if (role === "STUDENT") {
    const dupStudentId = await prisma.user.findUnique({ where: { studentId } });
    if (dupStudentId) return NextResponse.json({ error: "รหัสนิสิตนี้มีในระบบแล้ว" }, { status: 409 });
  }

  const password = generatePassword(10);
  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        roles: [role as any],
        studentId: role === "STUDENT" ? studentId : undefined,
        passwordHash,
      },
    });
  } catch (e: any) {
    // Unique-constraint race: two simultaneous registrations with the same email/studentId
    if (e?.code === "P2002")
      return NextResponse.json({ error: "อีเมลหรือรหัสนิสิตนี้มีในระบบแล้ว" }, { status: 409 });
    throw e;
  }

  const { sent } = await sendWelcomeEmail({ userId: user.id, name: user.name, email: user.email, password, role });

  return NextResponse.json({ ok: true, emailSent: sent }, { status: 201 });
}
