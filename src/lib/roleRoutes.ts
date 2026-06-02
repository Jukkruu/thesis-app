import { Role } from "@/types";

export const ROLE_ROUTES: Record<Role, string> = {
  STUDENT: "/dashboard/student",
  ADVISOR: "/dashboard/advisor",
  PROGRAM_CHAIR: "/dashboard/program-chair",
  EXAM_COMMITTEE: "/dashboard/exam-committee",
  DEPT_STAFF: "/dashboard/dept-staff",
  FACULTY_DEAN: "/dashboard/faculty-dean",
  GRADUATE_SCHOOL: "/dashboard/graduate-school",
};
