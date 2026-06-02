"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  MockUser,
  MockSubmission,
  MockWorkflowStep,
  Role,
  FormType,
  SubmissionStatus,
} from "@/types";

// ─── Mock users (one per role) ────────────────────────────────────────────────

export const MOCK_USERS: MockUser[] = [
  { id: "u-admin", name: "P บู (ผู้ดูแลระบบ)", email: "admin@thesis.ac.th", role: "ADMIN" },
  { id: "u-student", name: "นายอานนท์ ใจดี", email: "student@thesis.ac.th", role: "STUDENT", studentId: "64010042" },
  { id: "u-advisor", name: "รศ.ดร.วิชัย พงษ์สวัสดิ์", email: "advisor@thesis.ac.th", role: "ADVISOR" },
  { id: "u-chair", name: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์", email: "chair@thesis.ac.th", role: "PROGRAM_CHAIR" },
  { id: "u-committee", name: "ดร.นภา รัตนวงศ์", email: "committee@thesis.ac.th", role: "EXAM_COMMITTEE" },
  { id: "u-staff", name: "น.ส.สุภาพร มั่นคง", email: "staff@thesis.ac.th", role: "DEPT_STAFF" },
  { id: "u-dean", name: "ศ.ดร.ประเสริฐ กิจสุวรรณ", email: "dean@thesis.ac.th", role: "FACULTY_DEAN" },
  { id: "u-grad", name: "น.ส.มนัสนันท์ อยู่สุข", email: "grad@thesis.ac.th", role: "GRADUATE_SCHOOL" },
];

// ─── Ordered workflow ─────────────────────────────────────────────────────────

const WORKFLOW_ROLES: Role[] = [
  "STUDENT",
  "ADVISOR",
  "PROGRAM_CHAIR",
  "DEPT_STAFF",
  "EXAM_COMMITTEE",
  "ADVISOR",
  "FACULTY_DEAN",
  "GRADUATE_SCHOOL",
];

function makeSteps(prefix: string, upToApproved: number): MockWorkflowStep[] {
  return WORKFLOW_ROLES.map((role, i) => ({
    id: `${prefix}-s${i + 1}`,
    stepOrder: i + 1,
    role,
    status: i < upToApproved ? "APPROVED" : i === upToApproved ? "PENDING" : "PENDING",
  }));
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

function makeInitial(): MockSubmission[] {
  return [
    {
      id: "sub-1",
      title: "การพัฒนาระบบตรวจสอบคุณภาพน้ำอัตโนมัติด้วย IoT",
      studentId: "u-student",
      advisorId: "u-advisor",
      status: "IN_PROGRESS",
      createdAt: "2025-01-10T08:00:00Z",
      uploads: [
        { id: "up-1a", formType: "BW1A", fileName: "บ.วศ.1ก_อานนท์.pdf", fileSize: 512000, uploadedAt: "2025-01-10T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-1-s1", stepOrder: 1, role: "STUDENT", status: "APPROVED", actedAt: "2025-01-10T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-1-s2", stepOrder: 2, role: "ADVISOR", status: "PENDING" },
        { id: "sub-1-s3", stepOrder: 3, role: "PROGRAM_CHAIR", status: "PENDING" },
        { id: "sub-1-s4", stepOrder: 4, role: "DEPT_STAFF", status: "PENDING" },
        { id: "sub-1-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "PENDING" },
        { id: "sub-1-s6", stepOrder: 6, role: "ADVISOR", status: "PENDING" },
        { id: "sub-1-s7", stepOrder: 7, role: "FACULTY_DEAN", status: "PENDING" },
        { id: "sub-1-s8", stepOrder: 8, role: "GRADUATE_SCHOOL", status: "PENDING" },
      ],
    },
    {
      id: "sub-2",
      title: "ระบบแนะนำการเรียนส่วนบุคคลด้วยปัญญาประดิษฐ์",
      studentId: "u-student",
      advisorId: "u-advisor",
      status: "IN_PROGRESS",
      createdAt: "2024-11-15T08:00:00Z",
      uploads: [
        { id: "up-2a", formType: "BW1A", fileName: "บ.วศ.1ก_AI.pdf", fileSize: 480000, uploadedAt: "2024-11-15T09:00:00Z" },
        { id: "up-2b", formType: "BW1B", fileName: "บ.วศ.1ข_AI.pdf", fileSize: 320000, uploadedAt: "2024-11-20T09:00:00Z" },
        { id: "up-2c", formType: "B2", fileName: "บ.2_AI.pdf", fileSize: 256000, uploadedAt: "2024-12-01T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-2-s1", stepOrder: 1, role: "STUDENT", status: "APPROVED", actedAt: "2024-11-15T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-2-s2", stepOrder: 2, role: "ADVISOR", status: "APPROVED", actedAt: "2024-11-22T10:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์", notes: "หัวข้อน่าสนใจ อนุมัติดำเนินการต่อ" },
        { id: "sub-2-s3", stepOrder: 3, role: "PROGRAM_CHAIR", status: "APPROVED", actedAt: "2024-11-28T14:00:00Z", actedByName: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์" },
        { id: "sub-2-s4", stepOrder: 4, role: "DEPT_STAFF", status: "APPROVED", actedAt: "2024-12-02T09:00:00Z", actedByName: "น.ส.สุภาพร มั่นคง", notes: "ออกหนังสือเชิญกรรมการเรียบร้อย" },
        { id: "sub-2-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "PENDING" },
        { id: "sub-2-s6", stepOrder: 6, role: "ADVISOR", status: "PENDING" },
        { id: "sub-2-s7", stepOrder: 7, role: "FACULTY_DEAN", status: "PENDING" },
        { id: "sub-2-s8", stepOrder: 8, role: "GRADUATE_SCHOOL", status: "PENDING" },
      ],
    },
    {
      id: "sub-3",
      title: "การวิเคราะห์ความเสี่ยงในตลาดหลักทรัพย์ด้วย Machine Learning",
      studentId: "u-student",
      advisorId: "u-advisor",
      status: "COMPLETED",
      createdAt: "2024-07-01T08:00:00Z",
      uploads: [
        { id: "up-3a", formType: "BW1A", fileName: "บ.วศ.1ก_ML.pdf", fileSize: 520000, uploadedAt: "2024-07-01T09:00:00Z" },
        { id: "up-3b", formType: "BW1B", fileName: "บ.วศ.1ข_ML.pdf", fileSize: 380000, uploadedAt: "2024-07-05T09:00:00Z" },
        { id: "up-3c", formType: "B2", fileName: "บ.2_ML.pdf", fileSize: 290000, uploadedAt: "2024-07-15T09:00:00Z" },
        { id: "up-3d", formType: "B3", fileName: "บ.3_ML.pdf", fileSize: 450000, uploadedAt: "2024-08-01T09:00:00Z" },
        { id: "up-3e", formType: "B4", fileName: "บ.4_ML.pdf", fileSize: 350000, uploadedAt: "2024-09-01T09:00:00Z" },
        { id: "up-3f", formType: "THESIS", fileName: "วิทยานิพนธ์_ฉบับสมบูรณ์.pdf", fileSize: 5120000, uploadedAt: "2024-09-15T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-3-s1", stepOrder: 1, role: "STUDENT", status: "APPROVED", actedAt: "2024-07-01T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-3-s2", stepOrder: 2, role: "ADVISOR", status: "APPROVED", actedAt: "2024-07-08T10:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์" },
        { id: "sub-3-s3", stepOrder: 3, role: "PROGRAM_CHAIR", status: "APPROVED", actedAt: "2024-07-15T14:00:00Z", actedByName: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์" },
        { id: "sub-3-s4", stepOrder: 4, role: "DEPT_STAFF", status: "APPROVED", actedAt: "2024-07-20T09:00:00Z", actedByName: "น.ส.สุภาพร มั่นคง" },
        { id: "sub-3-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "APPROVED", actedAt: "2024-08-05T10:00:00Z", actedByName: "ดร.นภา รัตนวงศ์", notes: "ผลงานดีเยี่ยม ผ่านการประเมิน" },
        { id: "sub-3-s6", stepOrder: 6, role: "ADVISOR", status: "APPROVED", actedAt: "2024-08-10T14:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์" },
        { id: "sub-3-s7", stepOrder: 7, role: "FACULTY_DEAN", status: "APPROVED", actedAt: "2024-09-05T10:00:00Z", actedByName: "ศ.ดร.ประเสริฐ กิจสุวรรณ" },
        { id: "sub-3-s8", stepOrder: 8, role: "GRADUATE_SCHOOL", status: "APPROVED", actedAt: "2024-09-20T10:00:00Z", actedByName: "น.ส.มนัสนันท์ อยู่สุข", notes: "รับวิทยานิพนธ์เรียบร้อย ขอแสดงความยินดี" },
      ],
    },
  ];
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  user: MockUser | null;
  users: MockUser[];
  submissions: MockSubmission[];
  login: (userId: string) => void;
  logout: () => void;
  createSubmission: (title: string, advisorId?: string) => MockSubmission;
  approveCurrentStep: (submissionId: string, notes?: string) => void;
  rejectCurrentStep: (submissionId: string, notes: string) => void;
  addUpload: (submissionId: string, formType: FormType, fileName: string, fileSize: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "thesis_mock_state";

interface StoredState {
  userId: string | null;
  submissions: MockSubmission[];
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { userId: null, submissions: makeInitial() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {
    // ignore
  }
  return { userId: null, submissions: makeInitial() };
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<MockSubmission[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadState();
    setUserId(state.userId);
    setSubmissions(state.submissions);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ userId, submissions });
  }, [userId, submissions, hydrated]);

  const user = MOCK_USERS.find((u) => u.id === userId) ?? null;

  function login(id: string) {
    setUserId(id);
  }

  function logout() {
    setUserId(null);
  }

  function createSubmission(title: string, advisorId?: string): MockSubmission {
    const id = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const sub: MockSubmission = {
      id,
      title,
      studentId: userId!,
      advisorId,
      status: "IN_PROGRESS",
      createdAt: now,
      uploads: [],
      workflowSteps: WORKFLOW_ROLES.map((role, i) => ({
        id: `${id}-s${i + 1}`,
        stepOrder: i + 1,
        role,
        status: "PENDING",
      })),
    };
    setSubmissions((prev) => [sub, ...prev]);
    return sub;
  }

  function approveCurrentStep(submissionId: string, notes?: string) {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const pendingIdx = sub.workflowSteps.findIndex((s) => s.status === "PENDING");
        if (pendingIdx === -1) return sub;

        const now = new Date().toISOString();
        const updatedSteps = sub.workflowSteps.map((s, i) =>
          i === pendingIdx
            ? { ...s, status: "APPROVED" as const, actedAt: now, actedByName: user?.name, notes }
            : s
        );

        const hasMore = updatedSteps.some((s) => s.status === "PENDING");
        const status: SubmissionStatus = hasMore ? "IN_PROGRESS" : "COMPLETED";

        return { ...sub, workflowSteps: updatedSteps, status };
      })
    );
  }

  function rejectCurrentStep(submissionId: string, notes: string) {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const pendingIdx = sub.workflowSteps.findIndex((s) => s.status === "PENDING");
        if (pendingIdx === -1) return sub;

        const now = new Date().toISOString();
        const updatedSteps = sub.workflowSteps.map((s, i) =>
          i === pendingIdx
            ? { ...s, status: "REJECTED" as const, actedAt: now, actedByName: user?.name, notes }
            : s
        );
        return { ...sub, workflowSteps: updatedSteps, status: "REJECTED" };
      })
    );
  }

  function addUpload(submissionId: string, formType: FormType, fileName: string, fileSize: number) {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const upload = {
          id: `up-${Date.now()}`,
          formType,
          fileName,
          fileSize,
          uploadedAt: new Date().toISOString(),
        };
        return { ...sub, uploads: [...sub.uploads, upload] };
      })
    );
  }

  if (!hydrated) return null;

  return (
    <AppContext.Provider
      value={{
        user,
        users: MOCK_USERS,
        submissions,
        login,
        logout,
        createSubmission,
        approveCurrentStep,
        rejectCurrentStep,
        addUpload,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
