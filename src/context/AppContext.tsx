"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  MockUser, MockSubmission, MockWorkflowStep,
  MockNotification, Role, FormType, SubmissionStatus,
} from "@/types";
import { STEP_NAMES, ROLE_LABELS } from "@/lib/utils";

// ─── Mock users ───────────────────────────────────────────────────────────────

export const MOCK_USERS: MockUser[] = [
  { id: "u-admin",      name: "P โบ้ (ผู้ดูแลระบบ)",       email: "admin@thesis.ac.th",      role: "ADMIN" },
  { id: "u-student",    name: "นายอานนท์ ใจดี",             email: "student@thesis.ac.th",    role: "STUDENT", studentId: "64010042" },
  { id: "u-advisor",    name: "รศ.ดร.วิชัย พงษ์สวัสดิ์",   email: "advisor@thesis.ac.th",    role: "ADVISOR" },
  { id: "u-chair",      name: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์",  email: "chair@thesis.ac.th",      role: "PROGRAM_CHAIR" },
  { id: "u-committee",  name: "ดร.นภา รัตนวงศ์ (ประธานสอบ)", email: "committee@thesis.ac.th",  role: "EXAM_COMMITTEE" },
  { id: "u-committee2", name: "รศ.ดร.ก้องภพ สุนทร",         email: "committee2@thesis.ac.th", role: "EXAM_COMMITTEE" },
  { id: "u-committee3", name: "ดร.พิมพ์ชนก เลิศวัฒนา",      email: "committee3@thesis.ac.th", role: "EXAM_COMMITTEE" },
  { id: "u-staff",      name: "น.ส.สุภาพร มั่นคง",         email: "staff@thesis.ac.th",      role: "DEPT_STAFF" },
  { id: "u-dean",       name: "ศ.ดร.ประเสริฐ กิจสุวรรณ",   email: "dean@thesis.ac.th",       role: "FACULTY_DEAN" },
  { id: "u-grad",       name: "น.ส.มนัสนันท์ อยู่สุข",     email: "grad@thesis.ac.th",       role: "GRADUATE_SCHOOL" },
];

// All committee members assigned to a defense by default
const COMMITTEE_IDS = ["u-committee", "u-committee2", "u-committee3"];

const WORKFLOW_ROLES: Role[] = [
  "STUDENT", "ADVISOR", "PROGRAM_CHAIR", "DEPT_STAFF",
  "EXAM_COMMITTEE", "ADVISOR", "FACULTY_DEAN", "GRADUATE_SCHOOL",
];

// ─── Seed data ────────────────────────────────────────────────────────────────

function makeInitial(): MockSubmission[] {
  return [
    {
      id: "sub-1", title: "การพัฒนาระบบตรวจสอบคุณภาพน้ำอัตโนมัติด้วย IoT",
      studentId: "u-student", advisorId: "u-advisor", status: "IN_PROGRESS",
      createdAt: "2025-01-10T08:00:00Z",
      uploads: [{ id: "up-1a", formType: "BW1A", fileName: "บ.วศ.1ก_อานนท์.pdf", fileSize: 512000, uploadedAt: "2025-01-10T09:00:00Z" }],
      workflowSteps: [
        { id: "sub-1-s1", stepOrder: 1, role: "STUDENT",        status: "APPROVED", actedAt: "2025-01-10T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-1-s2", stepOrder: 2, role: "ADVISOR",        status: "PENDING" },
        { id: "sub-1-s3", stepOrder: 3, role: "PROGRAM_CHAIR",  status: "PENDING" },
        { id: "sub-1-s4", stepOrder: 4, role: "DEPT_STAFF",     status: "PENDING" },
        { id: "sub-1-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "PENDING", committeeMembers: COMMITTEE_IDS },
        { id: "sub-1-s6", stepOrder: 6, role: "ADVISOR",        status: "PENDING" },
        { id: "sub-1-s7", stepOrder: 7, role: "FACULTY_DEAN",   status: "PENDING" },
        { id: "sub-1-s8", stepOrder: 8, role: "GRADUATE_SCHOOL",status: "PENDING" },
      ],
    },
    {
      id: "sub-2", title: "ระบบแนะนำการเรียนส่วนบุคคลด้วยปัญญาประดิษฐ์",
      studentId: "u-student", advisorId: "u-advisor", status: "IN_PROGRESS",
      createdAt: "2024-11-15T08:00:00Z",
      uploads: [
        { id: "up-2a", formType: "BW1A", fileName: "บ.วศ.1ก_AI.pdf",  fileSize: 480000, uploadedAt: "2024-11-15T09:00:00Z" },
        { id: "up-2b", formType: "BW1B", fileName: "บ.วศ.1ข_AI.pdf",  fileSize: 320000, uploadedAt: "2024-11-20T09:00:00Z" },
        { id: "up-2c", formType: "B2",   fileName: "บ.2_AI.pdf",       fileSize: 256000, uploadedAt: "2024-12-01T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-2-s1", stepOrder: 1, role: "STUDENT",        status: "APPROVED", actedAt: "2024-11-15T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-2-s2", stepOrder: 2, role: "ADVISOR",        status: "APPROVED", actedAt: "2024-11-22T10:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์", notes: "หัวข้อน่าสนใจ อนุมัติดำเนินการต่อ" },
        { id: "sub-2-s3", stepOrder: 3, role: "PROGRAM_CHAIR",  status: "APPROVED", actedAt: "2024-11-28T14:00:00Z", actedByName: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์" },
        { id: "sub-2-s4", stepOrder: 4, role: "DEPT_STAFF",     status: "APPROVED", actedAt: "2024-12-02T09:00:00Z", actedByName: "น.ส.สุภาพร มั่นคง", notes: "ออกหนังสือเชิญกรรมการเรียบร้อย" },
        { id: "sub-2-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "PENDING", committeeMembers: COMMITTEE_IDS,
          committeeActions: [
            { userId: "u-committee", name: "ดร.นภา รัตนวงศ์ (ประธานสอบ)", decision: "APPROVED", notes: "เนื้อหาครบถ้วน", actedAt: "2024-12-04T10:00:00Z" },
          ] },
        { id: "sub-2-s6", stepOrder: 6, role: "ADVISOR",        status: "PENDING" },
        { id: "sub-2-s7", stepOrder: 7, role: "FACULTY_DEAN",   status: "PENDING" },
        { id: "sub-2-s8", stepOrder: 8, role: "GRADUATE_SCHOOL",status: "PENDING" },
      ],
    },
    {
      id: "sub-3", title: "การวิเคราะห์ความเสี่ยงในตลาดหลักทรัพย์ด้วย Machine Learning",
      studentId: "u-student", advisorId: "u-advisor", status: "COMPLETED",
      createdAt: "2024-07-01T08:00:00Z",
      uploads: [
        { id: "up-3a", formType: "BW1A",  fileName: "บ.วศ.1ก_ML.pdf",          fileSize: 520000,  uploadedAt: "2024-07-01T09:00:00Z" },
        { id: "up-3b", formType: "BW1B",  fileName: "บ.วศ.1ข_ML.pdf",          fileSize: 380000,  uploadedAt: "2024-07-05T09:00:00Z" },
        { id: "up-3c", formType: "B2",    fileName: "บ.2_ML.pdf",               fileSize: 290000,  uploadedAt: "2024-07-15T09:00:00Z" },
        { id: "up-3d", formType: "B3",    fileName: "บ.3_ML.pdf",               fileSize: 450000,  uploadedAt: "2024-08-01T09:00:00Z" },
        { id: "up-3e", formType: "B4",    fileName: "บ.4_ML.pdf",               fileSize: 350000,  uploadedAt: "2024-09-01T09:00:00Z" },
        { id: "up-3f", formType: "THESIS",fileName: "วิทยานิพนธ์_ฉบับสมบูรณ์.pdf", fileSize: 5120000, uploadedAt: "2024-09-15T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-3-s1", stepOrder: 1, role: "STUDENT",        status: "APPROVED", actedAt: "2024-07-01T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-3-s2", stepOrder: 2, role: "ADVISOR",        status: "APPROVED", actedAt: "2024-07-08T10:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์" },
        { id: "sub-3-s3", stepOrder: 3, role: "PROGRAM_CHAIR",  status: "APPROVED", actedAt: "2024-07-15T14:00:00Z", actedByName: "ผศ.ดร.สมชาย วงษ์ประดิษฐ์" },
        { id: "sub-3-s4", stepOrder: 4, role: "DEPT_STAFF",     status: "APPROVED", actedAt: "2024-07-20T09:00:00Z", actedByName: "น.ส.สุภาพร มั่นคง" },
        { id: "sub-3-s5", stepOrder: 5, role: "EXAM_COMMITTEE", status: "APPROVED", actedAt: "2024-08-05T10:00:00Z", actedByName: "กรรมการสอบ 3 ท่าน", notes: "ผลงานดีเยี่ยม ผ่านการประเมิน", committeeMembers: COMMITTEE_IDS,
          committeeActions: [
            { userId: "u-committee",  name: "ดร.นภา รัตนวงศ์ (ประธานสอบ)", decision: "APPROVED", notes: "ผลงานดีเยี่ยม", actedAt: "2024-08-03T10:00:00Z" },
            { userId: "u-committee2", name: "รศ.ดร.ก้องภพ สุนทร",         decision: "APPROVED", actedAt: "2024-08-04T11:00:00Z" },
            { userId: "u-committee3", name: "ดร.พิมพ์ชนก เลิศวัฒนา",      decision: "APPROVED", actedAt: "2024-08-05T10:00:00Z" },
          ] },
        { id: "sub-3-s6", stepOrder: 6, role: "ADVISOR",        status: "APPROVED", actedAt: "2024-08-10T14:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์" },
        { id: "sub-3-s7", stepOrder: 7, role: "FACULTY_DEAN",   status: "APPROVED", actedAt: "2024-09-05T10:00:00Z", actedByName: "ศ.ดร.ประเสริฐ กิจสุวรรณ" },
        { id: "sub-3-s8", stepOrder: 8, role: "GRADUATE_SCHOOL",status: "APPROVED", actedAt: "2024-09-20T10:00:00Z", actedByName: "น.ส.มนัสนันท์ อยู่สุข", notes: "รับวิทยานิพนธ์เรียบร้อย ขอแสดงความยินดี" },
      ],
    },
  ];
}

// ─── Seed notifications (pre-loaded for demo) ─────────────────────────────────

function makeInitialNotifications(): MockNotification[] {
  return [
    {
      id: "n-1", recipientId: "u-advisor", type: "pending",
      message: "รอการพิจารณาจากท่าน",
      detail: "การพัฒนาระบบตรวจสอบคุณภาพน้ำอัตโนมัติด้วย IoT",
      submissionId: "sub-1", isRead: false, createdAt: "2025-01-10T09:05:00Z",
    },
    {
      id: "n-2", recipientId: "u-committee", type: "pending",
      message: "รอการพิจารณาจากท่าน",
      detail: "ระบบแนะนำการเรียนส่วนบุคคลด้วยปัญญาประดิษฐ์",
      submissionId: "sub-2", isRead: false, createdAt: "2024-12-02T09:05:00Z",
    },
    {
      id: "n-3", recipientId: "u-student", type: "approved",
      message: "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉",
      detail: "การวิเคราะห์ความเสี่ยงในตลาดหลักทรัพย์ด้วย Machine Learning",
      submissionId: "sub-3", isRead: true, createdAt: "2024-09-20T10:05:00Z",
    },
  ];
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface AppContextType {
  user: MockUser | null;
  users: MockUser[];
  submissions: MockSubmission[];
  notifications: MockNotification[];
  unreadCount: number;
  login: (userId: string) => void;
  logout: () => void;
  createSubmission: (title: string, advisorId?: string) => MockSubmission;
  approveCurrentStep: (submissionId: string, notes?: string) => void;
  rejectCurrentStep: (submissionId: string, notes: string) => void;
  addUpload: (submissionId: string, formType: FormType, fileName: string, fileSize: number) => void;
  getPendingCount: (role: Role) => number;
  studentResubmit: (submissionId: string) => void;
  committeeSign: (submissionId: string, decision: "APPROVED" | "REJECTED", notes?: string) => void;
  needsMyAction: (sub: MockSubmission) => boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Admin
  adminSetNote: (submissionId: string, note: string) => void;
  adminUpdateSubmission: (id: string, updates: { title?: string; advisorId?: string }) => void;
  adminDeleteSubmission: (id: string) => void;
  adminResetSubmission: (id: string) => void;
  adminOverrideStep: (submissionId: string, stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "thesis_mock_state_v3";

interface StoredState {
  userId: string | null;
  submissions: MockSubmission[];
  notifications: MockNotification[];
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { userId: null, submissions: makeInitial(), notifications: makeInitialNotifications() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      return {
        ...parsed,
        notifications: parsed.notifications ?? makeInitialNotifications(),
      };
    }
  } catch { /* ignore */ }
  return { userId: null, submissions: makeInitial(), notifications: makeInitialNotifications() };
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Notification helpers ─────────────────────────────────────────────────────

let _nid = 0;

function makeNotif(
  recipientId: string,
  message: string,
  detail: string,
  submissionId: string,
  type: MockNotification["type"]
): MockNotification {
  return {
    id: `n-${Date.now()}-${++_nid}`,
    recipientId, message, detail, submissionId,
    isRead: false,
    createdAt: new Date().toISOString(),
    type,
  };
}

function notifyRole(role: Role, message: string, detail: string, submissionId: string, type: MockNotification["type"]): MockNotification | null {
  const recipient = MOCK_USERS.find((u) => u.role === role);
  if (!recipient) return null;
  return makeNotif(recipient.id, message, detail, submissionId, type);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId,        setUserId]        = useState<string | null>(null);
  const [submissions,   setSubmissions]   = useState<MockSubmission[]>([]);
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [hydrated,      setHydrated]      = useState(false);

  useEffect(() => {
    const state = loadState();
    setUserId(state.userId);
    setSubmissions(state.submissions);
    setNotifications(state.notifications);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ userId, submissions, notifications });
  }, [userId, submissions, notifications, hydrated]);

  const user = MOCK_USERS.find((u) => u.id === userId) ?? null;
  const unreadCount = notifications.filter((n) => !n.isRead && n.recipientId === userId).length;

  function pushNotifs(notifs: (MockNotification | null)[]) {
    const valid = notifs.filter(Boolean) as MockNotification[];
    if (valid.length > 0) setNotifications((prev) => [...valid, ...prev]);
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  function login(id: string) { setUserId(id); }
  function logout() { setUserId(null); }

  // ─── Submission actions ────────────────────────────────────────────────────

  function createSubmission(title: string, advisorId?: string): MockSubmission {
    const id  = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const sub: MockSubmission = {
      id, title,
      studentId: userId!,
      advisorId,
      status: "IN_PROGRESS",
      createdAt: now,
      uploads: [],
      workflowSteps: WORKFLOW_ROLES.map((role, i) => ({
        id: `${id}-s${i + 1}`, stepOrder: i + 1, role, status: "PENDING" as const,
        ...(role === "EXAM_COMMITTEE" ? { committeeMembers: COMMITTEE_IDS } : {}),
      })),
    };
    setSubmissions((prev) => [sub, ...prev]);

    // Notify advisor if assigned
    if (advisorId) {
      const adv = MOCK_USERS.find((u) => u.id === advisorId);
      if (adv) pushNotifs([makeNotif(adv.id, "มีคำร้องใหม่รอการตรวจสอบ", title, id, "pending")]);
    }
    return sub;
  }

  function approveCurrentStep(submissionId: string, notes?: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const pendingIdx = sub.workflowSteps.findIndex((s) => s.status === "PENDING");
    if (pendingIdx === -1) return;

    const now          = new Date().toISOString();
    const updatedSteps = sub.workflowSteps.map((s, i) =>
      i === pendingIdx
        ? { ...s, status: "APPROVED" as const, actedAt: now, actedByName: user?.name, notes }
        : s
    );
    const hasMore = updatedSteps.some((s) => s.status === "PENDING");
    const status: SubmissionStatus = hasMore ? "IN_PROGRESS" : "COMPLETED";

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, workflowSteps: updatedSteps, status } : s))
    );

    // Notifications
    const notifs: (MockNotification | null)[] = [];
    const nextStep = updatedSteps.find((s) => s.status === "PENDING");
    if (nextStep) {
      notifs.push(notifyRole(
        nextStep.role,
        `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`,
        sub.title, submissionId, "pending"
      ));
    }
    if (status === "COMPLETED") {
      notifs.push(makeNotif(sub.studentId, "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", sub.title, submissionId, "approved"));
    }
    pushNotifs(notifs);
  }

  function rejectCurrentStep(submissionId: string, notes: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const pendingIdx = sub.workflowSteps.findIndex((s) => s.status === "PENDING");
    if (pendingIdx === -1) return;

    const now          = new Date().toISOString();
    const updatedSteps = sub.workflowSteps.map((s, i) =>
      i === pendingIdx
        ? { ...s, status: "REJECTED" as const, actedAt: now, actedByName: user?.name, notes }
        : s
    );
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, workflowSteps: updatedSteps, status: "REJECTED" } : s))
    );

    // Notify student
    pushNotifs([makeNotif(sub.studentId, `คำร้องถูกปฏิเสธ — กรุณาตรวจสอบและแก้ไข`, sub.title, submissionId, "rejected")]);
  }

  function addUpload(submissionId: string, formType: FormType, fileName: string, fileSize: number) {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        return {
          ...sub,
          uploads: [...sub.uploads, {
            id: `up-${Date.now()}`, formType, fileName, fileSize,
            uploadedAt: new Date().toISOString(),
          }],
        };
      })
    );
  }

  // Does this submission currently need action from the logged-in user?
  function needsMyAction(sub: MockSubmission): boolean {
    if (!user) return false;
    const step = sub.workflowSteps.find((s) => s.status === "PENDING");
    if (!step || step.role !== user.role) return false;
    if (step.role === "EXAM_COMMITTEE") {
      if (!step.committeeMembers?.includes(user.id)) return false;
      return !(step.committeeActions ?? []).some((a) => a.userId === user.id);
    }
    return true;
  }

  function getPendingCount(role: Role): number {
    return submissions.filter((sub) => {
      const step = sub.workflowSteps.find((s) => s.status === "PENDING");
      if (step?.role !== role) return false;
      // Committee step: only count if THIS user still needs to sign
      if (role === "EXAM_COMMITTEE" && user) {
        if (!step.committeeMembers?.includes(user.id)) return false;
        return !(step.committeeActions ?? []).some((a) => a.userId === user.id);
      }
      return true;
    }).length;
  }

  function committeeSign(submissionId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub || !user) return;

    const stepIdx = sub.workflowSteps.findIndex((s) => s.status === "PENDING");
    if (stepIdx === -1) return;
    const step = sub.workflowSteps[stepIdx];
    if (step.role !== "EXAM_COMMITTEE") return;
    if (!step.committeeMembers?.includes(user.id)) return;

    const prevActions = step.committeeActions ?? [];
    if (prevActions.some((a) => a.userId === user.id)) return; // already signed

    const now = new Date().toISOString();
    const newActions = [
      ...prevActions,
      { userId: user.id, name: user.name, decision, notes, actedAt: now },
    ];

    // Any rejection fails the whole step immediately
    if (decision === "REJECTED") {
      const updatedSteps = sub.workflowSteps.map((s, i) =>
        i === stepIdx
          ? { ...s, status: "REJECTED" as const, committeeActions: newActions, actedAt: now, actedByName: user.name, notes }
          : s
      );
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, workflowSteps: updatedSteps, status: "REJECTED" } : s)));
      pushNotifs([makeNotif(sub.studentId, "กรรมการสอบไม่อนุมัติ — กรุณาตรวจสอบและแก้ไข", sub.title, submissionId, "rejected")]);
      return;
    }

    // Approved: advance only when ALL assigned members have approved
    const allApproved = step.committeeMembers.every(
      (mid) => newActions.find((a) => a.userId === mid)?.decision === "APPROVED"
    );

    if (!allApproved) {
      // Record this member's sign-off, stay pending
      const updatedSteps = sub.workflowSteps.map((s, i) =>
        i === stepIdx ? { ...s, committeeActions: newActions } : s
      );
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, workflowSteps: updatedSteps } : s)));
      return;
    }

    // All approved → advance workflow
    const updatedSteps = sub.workflowSteps.map((s, i) =>
      i === stepIdx
        ? { ...s, status: "APPROVED" as const, committeeActions: newActions, actedAt: now, actedByName: "กรรมการสอบครบทุกท่าน" }
        : s
    );
    const hasMore = updatedSteps.some((s) => s.status === "PENDING");
    const status: SubmissionStatus = hasMore ? "IN_PROGRESS" : "COMPLETED";
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, workflowSteps: updatedSteps, status } : s)));

    const notifs: (MockNotification | null)[] = [];
    const nextStep = updatedSteps.find((s) => s.status === "PENDING");
    if (nextStep) {
      notifs.push(notifyRole(nextStep.role, `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`, sub.title, submissionId, "pending"));
    }
    if (status === "COMPLETED") {
      notifs.push(makeNotif(sub.studentId, "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", sub.title, submissionId, "approved"));
    }
    pushNotifs(notifs);
  }

  function studentResubmit(submissionId: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== "REJECTED") return;

    const rejectedStep = sub.workflowSteps.find((s) => s.status === "REJECTED");
    if (!rejectedStep) return;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id !== submissionId ? s : {
          ...s, status: "IN_PROGRESS" as const,
          workflowSteps: s.workflowSteps.map((st) =>
            st.id === rejectedStep.id
              ? { ...st, status: "PENDING" as const, actedAt: undefined, actedByName: undefined, notes: undefined }
              : st
          ),
        }
      )
    );

    // Notify the role that had rejected (they need to re-review)
    pushNotifs([notifyRole(rejectedStep.role, "นักศึกษาแก้ไขและยื่นคำร้องใหม่แล้ว", sub.title, submissionId, "info")]);
  }

  // ─── Notification actions ──────────────────────────────────────────────────

  function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) =>
      prev.map((n) => (n.recipientId === userId ? { ...n, isRead: true } : n))
    );
  }

  // ─── Admin actions ─────────────────────────────────────────────────────────

  function adminSetNote(submissionId: string, note: string) {
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, adminNote: note } : s)));
  }

  function adminUpdateSubmission(id: string, updates: { title?: string; advisorId?: string }) {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function adminDeleteSubmission(id: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }

  function adminResetSubmission(id: string) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id !== id ? s : {
          ...s, status: "IN_PROGRESS" as const,
          workflowSteps: s.workflowSteps.map((step) => ({
            ...step, status: "PENDING" as const,
            actedAt: undefined, actedByName: undefined, notes: undefined,
          })),
        }
      )
    );
  }

  function adminOverrideStep(submissionId: string, stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const updatedSteps = sub.workflowSteps.map((step) =>
      step.stepOrder === stepOrder
        ? { ...step, status: action, actedAt: new Date().toISOString(), actedByName: user?.name, notes }
        : step
    );
    const hasMorePending = updatedSteps.some((st) => st.status === "PENDING");
    const status: SubmissionStatus = action === "REJECTED" ? "REJECTED" : hasMorePending ? "IN_PROGRESS" : "COMPLETED";

    setSubmissions((prev) =>
      prev.map((s) => (s.id !== submissionId ? s : { ...s, workflowSteps: updatedSteps, status }))
    );

    // Notify student of admin override
    const stepName = STEP_NAMES[stepOrder] ?? `ขั้นที่ ${stepOrder}`;
    pushNotifs([makeNotif(
      sub.studentId,
      `ผู้ดูแลระบบแก้ไขสถานะ: ${stepName} → ${action === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}`,
      sub.title, submissionId, action === "APPROVED" ? "info" : "rejected"
    )]);

    // Also notify next role if approved
    if (action === "APPROVED") {
      const nextStep = updatedSteps.find((s) => s.status === "PENDING");
      if (nextStep) {
        pushNotifs([notifyRole(nextStep.role, `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`, sub.title, submissionId, "pending")]);
      }
      if (status === "COMPLETED") {
        pushNotifs([makeNotif(sub.studentId, "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", sub.title, submissionId, "approved")]);
      }
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, users: MOCK_USERS, submissions, notifications, unreadCount,
      login, logout, createSubmission, approveCurrentStep, rejectCurrentStep,
      addUpload, getPendingCount, studentResubmit,
      committeeSign, needsMyAction,
      markNotificationRead, markAllNotificationsRead,
      adminSetNote, adminUpdateSubmission, adminDeleteSubmission,
      adminResetSubmission, adminOverrideStep,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
