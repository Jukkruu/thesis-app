import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendForgotPasswordEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email: string = body.email ?? "";

  if (!email.trim()) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  // Each successful request CHANGES the target's password — without limits an attacker
  // could lock a user out repeatedly and flood their inbox. Per-email and per-IP caps.
  if (
    !(await rateLimit(`fp:email:${normalizedEmail}`, 5, 3600)) ||
    !(await rateLimit(`fp:ip:${clientIp(req)}`, 20, 3600))
  )
    return NextResponse.json({ error: "ขอรหัสผ่านใหม่บ่อยเกินไป กรุณาลองใหม่ในอีก 1 ชั่วโมง" }, { status: 429 });
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const password = generatePassword(10);
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await sendForgotPasswordEmail({
      userId: user.id,
      name: user.name,
      email: user.email,
      password,
      role: user.roles[0] ?? "STUDENT",
    });
  }

  // Always return success — don't reveal whether email exists
  return NextResponse.json({ ok: true });
}
