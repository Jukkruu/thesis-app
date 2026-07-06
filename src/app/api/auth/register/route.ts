import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name: string = body.name ?? "";
  const email: string = body.email ?? "";

  if (!name.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
  if (!email.trim()) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 409 });

  const password = generatePassword(10);
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      roles: ["STUDENT"],
      passwordHash,
    },
  });

  await sendWelcomeEmail({ userId: user.id, name: user.name, email: user.email, password });

  return NextResponse.json({ ok: true }, { status: 201 });
}
