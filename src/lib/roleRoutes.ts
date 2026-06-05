import { Role } from "@/types";

export const ROLE_ROUTES: Record<Role, string> = {
  STUDENT:               "/dashboard/student",
  ADVISOR:               "/dashboard/advisor",
  PROGRAM_CHAIR:         "/dashboard/program-chair",
  HEAD_EXAM_COMMITTEE:   "/dashboard/head-exam-committee",
  EXAM_COMMITTEE:        "/dashboard/exam-committee",
  INVITED_EXAM_COMMITTEE:"/dashboard/invited-exam-committee",
  DEPT_STAFF:            "/dashboard/dept-staff",
  FACULTY_DEAN:          "/dashboard/faculty-dean",
  GRADUATE_SCHOOL:       "/dashboard/graduate-school",
  ADMIN:                 "/dashboard/admin",
  SUPER_ADMIN:           "/dashboard/super-admin",
};
