import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles as string[],
          role: (user.roles[0] ?? "") as string,
          studentId: user.studentId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user.id ?? "") as string;
        token.roles = (user as any).roles as string[];
        token.role = ((user as any).roles?.[0] ?? "") as string;
        token.studentId = (user as any).studentId as string | undefined;
      }
      // Backward compat: if old token has role but no roles, derive roles
      if (!token.roles && token.role) {
        token.roles = [token.role as string];
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.roles = (token.roles ?? [token.role]) as string[];
      session.user.role = ((token.roles as string[])?.[0] ?? token.role) as string;
      session.user.studentId = token.studentId as string | undefined;
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
});
