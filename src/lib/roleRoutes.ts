import { Role } from "@/types";

export const ROLE_ROUTES: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  ADMIN:       "/dashboard/admin",
  STUDENT:     "/dashboard/student",
  PROFESSOR:   "/dashboard/professor",
};
