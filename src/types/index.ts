export type Role =
  | "STUDENT"
  | "ADVISOR"
  | "PROGRAM_CHAIR"
  | "EXAM_COMMITTEE"
  | "DEPT_STAFF"
  | "FACULTY_DEAN"
  | "GRADUATE_SCHOOL";

export type FormType = "BW1A" | "BW1B" | "B2" | "B3" | "B4" | "THESIS";
export type StepStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
export type SubmissionStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
}

export interface MockUpload {
  id: string;
  formType: FormType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface MockWorkflowStep {
  id: string;
  stepOrder: number;
  role: Role;
  status: StepStatus;
  notes?: string;
  actedAt?: string;
  actedByName?: string;
}

export interface MockSubmission {
  id: string;
  title: string;
  studentId: string;
  advisorId?: string;
  status: SubmissionStatus;
  createdAt: string;
  uploads: MockUpload[];
  workflowSteps: MockWorkflowStep[];
}
