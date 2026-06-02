export type Role =
  | "STUDENT"
  | "ADVISOR"
  | "PROGRAM_CHAIR"
  | "EXAM_COMMITTEE"
  | "DEPT_STAFF"
  | "FACULTY_DEAN"
  | "GRADUATE_SCHOOL"
  | "ADMIN";

export type FormType = "BW1A" | "BW1B" | "B2" | "B3" | "B4" | "THESIS" | "SIGNED";
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

export interface CommitteeAction {
  userId: string;
  name: string;
  decision: "APPROVED" | "REJECTED";
  notes?: string;
  actedAt: string;
}

export interface MockWorkflowStep {
  id: string;
  stepOrder: number;
  role: Role;
  status: StepStatus;
  notes?: string;
  actedAt?: string;
  actedByName?: string;
  // For multi-member committee steps (EXAM_COMMITTEE):
  committeeMembers?: string[];        // assigned committee user IDs
  committeeActions?: CommitteeAction[]; // per-member sign-offs
}

export type NotificationType = "pending" | "approved" | "rejected" | "info";

export interface MockNotification {
  id: string;
  recipientId: string;
  message: string;
  detail: string;
  submissionId: string;
  isRead: boolean;
  createdAt: string;
  type: NotificationType;
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
  adminNote?: string;
}
