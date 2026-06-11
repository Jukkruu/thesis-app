import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    studentId?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      studentId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    studentId?: string;
  }
}
