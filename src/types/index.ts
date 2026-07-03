export type Role =
  | "STUDENT"
  | "ADVISOR"
  | "CO_ADVISOR"
  | "PROGRAM_CHAIR"
  | "HEAD_EXAM_COMMITTEE"
  | "EXAM_COMMITTEE"
  | "INVITED_EXAM_COMMITTEE"
  | "DEPT_STAFF"
  | "FACULTY_DEAN"
  | "GRADUATE_SCHOOL"
  | "ADMIN"
  | "SUPER_ADMIN";

export type FormType = "BW1A" | "BW1B" | "B1C" | "B1D" | "B2" | "B3" | "B4" | "THESIS" | "SIGNED" | "FINANCE_DOC" | "EXAM_RESULT" | "INVITE_LETTER" | "VERY_GOOD_EVAL";
export type ProgramType = "PHD" | "ME_MECH" | "ME_CPS";
export type SubmissionType = "PROPOSAL" | "THESIS_DEFENSE";
export type StepStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
export type SubmissionStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  role: Role; // primary role = roles[0]
  studentId?: string;
}

export interface MockUpload {
  id: string;
  formType: FormType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  fileUrl?: string | null;
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
  submissionType?: SubmissionType;
  studentId: string;
  advisorId?: string;
  status: SubmissionStatus;
  createdAt: string;
  uploads: MockUpload[];
  workflowSteps: MockWorkflowStep[];
  adminNote?: string;
  // Student info
  studentFullName?: string;
  studentCode?: string;
  program?: ProgramType;
  studentEmail?: string;
  studentPhone?: string;
  // Committee assignment
  headCommitteeId?: string;
  committeeIds?: string[];
  coAdvisorIds?: string[];
  invitedCommitteeId?: string;
  // External (invited) professor free-text details
  invitedProfName?: string;
  invitedProfAffiliation?: string;
  invitedProfEmail?: string;
  invitedProfPhone?: string;
  // Exam logistics
  examDate?: string;
  examTime?: string;
  roomNeeded?: boolean;
  parkingNeeded?: boolean;
  carPlate?: string;
}
