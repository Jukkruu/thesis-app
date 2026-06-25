import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function mapUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, studentId: u.studentId ?? undefined };
}

const FACULTY_ROLES = ["ADVISOR", "CO_ADVISOR", "HEAD_EXAM_COMMITTEE", "EXAM_COMMITTEE", "INVITED_EXAM_COMMITTEE", "PROGRAM_CHAIR"];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

  // Admins get the full user list; everyone else gets only faculty/committee roles
  // (needed by students to pick advisors/committee, and by detail views for names)
  const where = isAdmin ? undefined : { role: { in: FACULTY_ROLES as any[] } };
  const users = await prisma.user.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json(users.map(mapUser));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, role, studentId, password } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
  if (!role)          return NextResponse.json({ error: "กรุณาเลือกบทบาท" }, { status: 400 });
  if (password && password.length < 6)
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password ?? randomBytes(32).toString("hex"), 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      studentId: studentId?.trim() || null,
      passwordHash,
    },
  });

  return NextResponse.json(mapUser(user), { status: 201 });
}
