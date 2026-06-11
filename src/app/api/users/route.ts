import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function mapUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, studentId: u.studentId ?? undefined };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(users.map(mapUser));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, role, studentId, password } = await req.json();
  const passwordHash = await bcrypt.hash(password ?? "password123", 12);

  const user = await prisma.user.create({
    data: { name, email, role, studentId: studentId || null, passwordHash },
  });

  return NextResponse.json(mapUser(user));
}
