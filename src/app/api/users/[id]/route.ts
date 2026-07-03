import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function mapUser(u: any) {
  const roles: string[] = u.roles ?? (u.role ? [u.role] : []);
  return { id: u.id, name: u.name, email: u.email, roles, role: roles[0] ?? "", studentId: u.studentId ?? undefined };
}

function sessionRoles(session: any): string[] {
  return (session?.user as any)?.roles ?? [session?.user?.role ?? ""];
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const sRoles = sessionRoles(session);
  if (!session?.user || !sRoles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (body.role !== undefined) {
    // Only SUPER_ADMIN can grant the SUPER_ADMIN role
    if (body.role === "SUPER_ADMIN" && !sRoles.includes("SUPER_ADMIN"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Setting role replaces entire roles array with single role
    data.roles = [body.role];
  }

  if (body.roles !== undefined) {
    // Only SUPER_ADMIN can grant the SUPER_ADMIN role
    if ((body.roles as string[]).includes("SUPER_ADMIN") && !sRoles.includes("SUPER_ADMIN"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    data.roles = body.roles;
  }

  if (body.password !== undefined) {
    if (!sRoles.includes("SUPER_ADMIN"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (typeof body.password !== "string" || body.password.length < 6)
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(mapUser(user));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !sessionRoles(session).includes("SUPER_ADMIN"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
