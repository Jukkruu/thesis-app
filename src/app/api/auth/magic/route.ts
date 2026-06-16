import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const magic = await prisma.magicToken.findUnique({ where: { token } });

  if (!magic || magic.expiresAt < new Date()) {
    // Expired or invalid — delete if it exists and redirect to login
    if (magic) await prisma.magicToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.redirect(new URL("/login?error=link-expired", req.url));
  }

  const user = await prisma.user.findUnique({ where: { id: magic.userId } });
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Build the session JWT matching the NextAuth JWT callback output
  const isSecure = req.url.startsWith("https://");
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const sessionToken = await encode({
    token: {
      sub:       user.id,
      id:        user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      studentId: user.studentId ?? undefined,
    },
    secret:  process.env.AUTH_SECRET!,
    salt:    cookieName,
    maxAge:  30 * 24 * 60 * 60, // 30 days
  });

  const redirectUrl = new URL(magic.redirectTo, req.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure:   isSecure,
    sameSite: "lax",
    path:     "/",
    maxAge:   30 * 24 * 60 * 60,
  });

  return response;
}
