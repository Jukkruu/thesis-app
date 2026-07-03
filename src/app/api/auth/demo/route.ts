import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const DEMO_EMAILS = new Set([
  "superadmin@eng.chula.ac.th",
  "admin@eng.chula.ac.th",
  "student@eng.chula.ac.th",
  "niphon.w@eng.chula.ac.th",
  "angkee.s@eng.chula.ac.th",
  "alongkorn.p@eng.chula.ac.th",
  "sunhapos.c@eng.chula.ac.th",
  "viboon.s@eng.chula.ac.th",
]);

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || !DEMO_EMAILS.has(email)) {
    return NextResponse.json({ error: "Not a demo account" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isSecure = req.url.startsWith("https://");
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

  const sessionToken = await encode({
    token: {
      sub:       user.id,
      id:        user.id,
      name:      user.name,
      email:     user.email,
      roles:     user.roles as string[],
      role:      (user.roles[0] ?? "") as string,
      studentId: user.studentId ?? undefined,
    },
    secret: process.env.AUTH_SECRET!,
    salt:   cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure:   isSecure,
    sameSite: "lax",
    path:     "/",
    maxAge:   SESSION_MAX_AGE,
  });
  return response;
}
