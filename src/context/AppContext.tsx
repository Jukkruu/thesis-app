"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  MockUser, MockSubmission, MockWorkflowStep,
  MockNotification, Role, FormType, SubmissionStatus, ProgramType, SubmissionType,
} from "@/types";
import { STEP_NAMES, ROLE_LABELS, PROGRAM_LABELS } from "@/lib/utils";

// ─── Submission form data ─────────────────────────────────────────────────────

export interface SubmissionFormData {
  title: string;
  submissionType?: SubmissionType;
  advisorId?: string;
  studentFullName?: string;
  studentCode?: string;
  program?: ProgramType;
  studentEmail?: string;
  studentPhone?: string;
  headCommitteeId?: string;
  committeeIds?: string[];
  invitedCommitteeId?: string;
  examDate?: string;
  examTime?: string;
  roomNeeded?: boolean;
  parkingNeeded?: boolean;
  carPlate?: string;
}

// ─── Mock users — real ME dept professors (Chulalongkorn University) ─────────

export const MOCK_USERS: MockUser[] = [
  // System accounts
  { id: "u-superadmin", name: "ผู้ดูแลระบบสูงสุด",         email: "superadmin@eng.chula.ac.th", role: "SUPER_ADMIN" },
  { id: "u-admin",      name: "พี่โบ้ (เจ้าหน้าที่ภาควิชา)", email: "admin@eng.chula.ac.th",      role: "ADMIN" },
  { id: "u-student",    name: "นายอานนท์ ใจดี",             email: "student@eng.chula.ac.th",    role: "STUDENT", studentId: "64100042" },
  { id: "u-chair",      name: "รศ.ดร.นิพนธ์ วรรณโสภาคย์",  email: "niphon.w@eng.chula.ac.th",   role: "PROGRAM_CHAIR" },
  { id: "u-invited",    name: "ศ.ดร.วิบูลย์ แสงวีระพันธุ์ศิริ", email: "viboon.s@eng.chula.ac.th", role: "INVITED_EXAM_COMMITTEE" },
  // Advisors (อาจารย์ที่ปรึกษา) — senior professors
  { id: "u-prof-PSG", name: "ศ.ดร.ไพโรจน์ สิงหถนัดกิจ",         email: "pairod.s@eng.chula.ac.th",    role: "ADVISOR" },
  { id: "u-prof-ASJ", name: "รศ.ดร.อศิ บุญจิตราดุลย์",           email: "asi.b@eng.chula.ac.th",       role: "ADVISOR" },
  { id: "u-prof-TJW", name: "รศ.ดร.ฐิติมา จินตนาวัน",           email: "thitima.j@eng.chula.ac.th",   role: "ADVISOR" },
  { id: "u-prof-KMN", name: "รศ.ดร.กุณฑินี มณีรัตน์",           email: "kuntinee.m@eng.chula.ac.th",  role: "ADVISOR" },
  { id: "u-prof-RCR", name: "รศ.ดร.รัชทิน จันทร์เจริญ",         email: "ratchatin.c@eng.chula.ac.th", role: "ADVISOR" },
  { id: "u-prof-CTT", name: "รศ.ดร.จิตติน แตงเที่ยง",           email: "chittin.t@eng.chula.ac.th",   role: "ADVISOR" },
  { id: "u-prof-ASK", name: "รศ.ดร.อังคีร์ ศรีภคากร",           email: "angkee.s@eng.chula.ac.th",    role: "ADVISOR" },
  { id: "u-prof-BLN", name: "รศ.ดร.บุญชัย เลิศนุวัฒน์",         email: "boonchai.l@eng.chula.ac.th",  role: "ADVISOR" },
  { id: "u-prof-PTP", name: "รศ.ดร.พงศ์แสน พิทักษ์วัชระ",      email: "phongsaen.p@eng.chula.ac.th", role: "ADVISOR" },
  { id: "u-prof-TSN", name: "รศ.ดร.ธัญญารัตน์ สิงหนาท",         email: "thanyarat.s@eng.chula.ac.th", role: "ADVISOR" },
  { id: "u-prof-NAV", name: "รศ.ดร.นภดนัย อาชวาคม",             email: "nopdanai.a@eng.chula.ac.th",  role: "ADVISOR" },
  { id: "u-prof-GPN", name: "รศ.ดร.กฤษฎา พนมเชิง",              email: "gridsada.p@eng.chula.ac.th",  role: "ADVISOR" },
  // Head Exam Committee (ประธานกรรมการสอบ)
  { id: "u-prof-APP", name: "รศ.ดร.อลงกรณ์ พิมพ์พิณ",          email: "alongkorn.p@eng.chula.ac.th", role: "HEAD_EXAM_COMMITTEE" },
  { id: "u-prof-CRW", name: "รศ.ดร.ชนัตต์ รัตนสุมาวงศ์",        email: "chanat.r@eng.chula.ac.th",    role: "HEAD_EXAM_COMMITTEE" },
  { id: "u-prof-JKA", name: "รศ.ดร.จิรพงศ์ กสิวิทย์อำนวย",      email: "jirapong.k@eng.chula.ac.th",  role: "HEAD_EXAM_COMMITTEE" },
  { id: "u-prof-WWS", name: "รศ.ดร.วิทยา วัณณสุโภประสิทธิ์",    email: "witaya.w@eng.chula.ac.th",    role: "HEAD_EXAM_COMMITTEE" },
  { id: "u-prof-SPT", name: "รศ.ดร.สมพงษ์ พุทธิวิสุทธิศักดิ์",  email: "sompong.p@eng.chula.ac.th",   role: "HEAD_EXAM_COMMITTEE" },
  // Exam Committee (กรรมการสอบ)
  { id: "u-prof-SCW", name: "ผศ.ดร.สัณหพศ จันทรานุวัฒน์",       email: "sunhapos.c@eng.chula.ac.th",  role: "EXAM_COMMITTEE" },
  { id: "u-prof-WSN", name: "ผศ.ดร.วีระยุทธ ศรีธุระวานิช",       email: "werayut.s@eng.chula.ac.th",   role: "EXAM_COMMITTEE" },
  { id: "u-prof-NNW", name: "ผศ.ดร.นักสิทธ์ นุ่มวงษ์",           email: "nuksit.n@eng.chula.ac.th",    role: "EXAM_COMMITTEE" },
  { id: "u-prof-PTT", name: "ผศ.ดร.ไพรัช ตั้งพรประเสริฐ",        email: "pairat.t@eng.chula.ac.th",    role: "EXAM_COMMITTEE" },
  { id: "u-prof-CVS", name: "ผศ.ดร.ชัญญาพันธ์ วิรุฬห์ศรี",       email: "chanyaphan.v@eng.chula.ac.th",role: "EXAM_COMMITTEE" },
  { id: "u-prof-TPP", name: "ผศ.ตะวัน ปภาพจน์",                  email: "tawan.p@eng.chula.ac.th",     role: "EXAM_COMMITTEE" },
  { id: "u-prof-SSL", name: "ผศ.ดร.สรัล ศาลากิจ",                email: "saran.s@eng.chula.ac.th",     role: "EXAM_COMMITTEE" },
  { id: "u-prof-SKM", name: "อ.ดร.สุรัฐ ขวัญเมือง",              email: "surat.k@eng.chula.ac.th",     role: "EXAM_COMMITTEE" },
  { id: "u-prof-NDS", name: "อ.ดร.ณัฐพล ดำรงค์พลาสิทธิ์",        email: "nattapol.d@eng.chula.ac.th",  role: "EXAM_COMMITTEE" },
  { id: "u-prof-RNC", name: "อ.ดร.รีนา เซย์",                    email: "rina.t@eng.chula.ac.th",      role: "EXAM_COMMITTEE" },
  { id: "u-prof-NVS", name: "อ.ดร.นภัสร วงษ์เสาวศุภ",            email: "naphatsorn.v@eng.chula.ac.th",role: "EXAM_COMMITTEE" },
  { id: "u-prof-SMK", name: "อ.ดร.สริตา โมรากุล",                email: "sarita.m@eng.chula.ac.th",    role: "EXAM_COMMITTEE" },
  { id: "u-prof-ASL", name: "อ.ดร.อัศวิน สาลี",                  email: "atsawin.s@eng.chula.ac.th",   role: "EXAM_COMMITTEE" },
  { id: "u-prof-PRR", name: "อ.ดร.ปริญเอก ร่มไตรรัตน์",          email: "parinayek.r@eng.chula.ac.th", role: "EXAM_COMMITTEE" },
  { id: "u-prof-ROY", name: "อ.ดร.รอยต่อ เจริญสินโอฬาร",         email: "roitor.c@eng.chula.ac.th",    role: "EXAM_COMMITTEE" },
];

// User IDs shown in the demo quick-login panel on the login page
export const DEMO_USER_IDS = [
  "u-superadmin", "u-admin", "u-student", "u-chair",
  "u-prof-ASK",   // ADVISOR demo
  "u-prof-APP",   // HEAD_EXAM_COMMITTEE demo
  "u-prof-SCW",   // EXAM_COMMITTEE demo
  "u-invited",    // INVITED_EXAM_COMMITTEE demo
];

// Regular exam committee members used in seed submissions
const COMMITTEE_IDS = ["u-prof-SCW", "u-prof-WSN"];

// Workflow: 8 ordered steps aligned with the 5-phase real process
const WORKFLOW_ROLES: Role[] = [
  "STUDENT",              // Phase 1: submit
  "ADMIN",                // Phase 1: admin approves (พี่โบ้ ตรวจรับเอกสาร)
  "PROGRAM_CHAIR",        // Phase 1: sign บ.วศ.1ก
  "HEAD_EXAM_COMMITTEE",  // Phase 2-3: sign first
  "EXAM_COMMITTEE",       // Phase 2-3: sign in order
  "ADVISOR",              // Phase 3: sign บ.3
  "INVITED_EXAM_COMMITTEE", // Phase 5: external committee signs
  "PROGRAM_CHAIR",        // Phase 5: final sign
];

// ─── Seed data ────────────────────────────────────────────────────────────────

function makeInitial(): MockSubmission[] {
  return [
    {
      id: "sub-1", title: "การพัฒนาระบบตรวจสอบคุณภาพน้ำอัตโนมัติด้วย IoT",
      studentId: "u-student", advisorId: "u-prof-ASK", status: "IN_PROGRESS",
      studentFullName: "นายอานนท์ ใจดี", studentCode: "6470001234", program: "ME_MECH" as const,
      studentEmail: "aanon@student.chula.ac.th", studentPhone: "0812345678",
      headCommitteeId: "u-prof-APP", committeeIds: COMMITTEE_IDS, invitedCommitteeId: "u-invited",
      createdAt: "2025-01-10T08:00:00Z",
      uploads: [{ id: "up-1a", formType: "BW1A", fileName: "บ.วศ.1ก_อานนท์.pdf", fileSize: 512000, uploadedAt: "2025-01-10T09:00:00Z" }],
      workflowSteps: [
        { id: "sub-1-s1", stepOrder: 1, role: "STUDENT",               status: "APPROVED", actedAt: "2025-01-10T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-1-s2", stepOrder: 2, role: "ADMIN",                 status: "PENDING" },
        { id: "sub-1-s3", stepOrder: 3, role: "PROGRAM_CHAIR",         status: "PENDING" },
        { id: "sub-1-s4", stepOrder: 4, role: "HEAD_EXAM_COMMITTEE",   status: "PENDING" },
        { id: "sub-1-s5", stepOrder: 5, role: "EXAM_COMMITTEE",        status: "PENDING", committeeMembers: COMMITTEE_IDS },
        { id: "sub-1-s6", stepOrder: 6, role: "ADVISOR",               status: "PENDING" },
        { id: "sub-1-s7", stepOrder: 7, role: "INVITED_EXAM_COMMITTEE",status: "PENDING" },
        { id: "sub-1-s8", stepOrder: 8, role: "PROGRAM_CHAIR",         status: "PENDING" },
      ],
    },
    {
      id: "sub-2", title: "ระบบแนะนำการเรียนส่วนบุคคลด้วยปัญญาประดิษฐ์",
      studentId: "u-student", advisorId: "u-prof-RCR", status: "IN_PROGRESS",
      headCommitteeId: "u-prof-CRW", committeeIds: COMMITTEE_IDS, invitedCommitteeId: "u-invited",
      createdAt: "2024-11-15T08:00:00Z",
      uploads: [
        { id: "up-2a", formType: "BW1A", fileName: "บ.วศ.1ก_AI.pdf",  fileSize: 480000, uploadedAt: "2024-11-15T09:00:00Z" },
        { id: "up-2b", formType: "BW1B", fileName: "บ.วศ.1ข_AI.pdf",  fileSize: 320000, uploadedAt: "2024-11-20T09:00:00Z" },
        { id: "up-2c", formType: "B1C",  fileName: "บ.วศ.1ค_AI.pdf",  fileSize: 256000, uploadedAt: "2024-12-01T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-2-s1", stepOrder: 1, role: "STUDENT",               status: "APPROVED", actedAt: "2024-11-15T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-2-s2", stepOrder: 2, role: "ADMIN",                 status: "APPROVED", actedAt: "2024-11-22T10:00:00Z", actedByName: "พี่โบ้ (เจ้าหน้าที่ภาควิชา)", notes: "ตรวจรับเอกสารเรียบร้อย" },
        { id: "sub-2-s3", stepOrder: 3, role: "PROGRAM_CHAIR",         status: "APPROVED", actedAt: "2024-11-28T14:00:00Z", actedByName: "รศ.ดร.นิพนธ์ วรรณโสภาคย์" },
        { id: "sub-2-s4", stepOrder: 4, role: "HEAD_EXAM_COMMITTEE",   status: "APPROVED", actedAt: "2024-12-02T09:00:00Z", actedByName: "รศ.ดร.ชนัตต์ รัตนสุมาวงศ์", notes: "ตรวจสอบแล้ว อนุมัติดำเนินการ" },
        { id: "sub-2-s5", stepOrder: 5, role: "EXAM_COMMITTEE",        status: "PENDING", committeeMembers: COMMITTEE_IDS },
        { id: "sub-2-s6", stepOrder: 6, role: "ADVISOR",               status: "PENDING" },
        { id: "sub-2-s7", stepOrder: 7, role: "INVITED_EXAM_COMMITTEE",status: "PENDING" },
        { id: "sub-2-s8", stepOrder: 8, role: "PROGRAM_CHAIR",         status: "PENDING" },
      ],
    },
    {
      id: "sub-3", title: "การวิเคราะห์ความเสี่ยงในตลาดหลักทรัพย์ด้วย Machine Learning",
      studentId: "u-student", advisorId: "u-prof-BLN", status: "COMPLETED",
      headCommitteeId: "u-prof-JKA", committeeIds: COMMITTEE_IDS, invitedCommitteeId: "u-invited",
      createdAt: "2024-07-01T08:00:00Z",
      uploads: [
        { id: "up-3a", formType: "BW1A",  fileName: "บ.วศ.1ก_ML.pdf",          fileSize: 520000,  uploadedAt: "2024-07-01T09:00:00Z" },
        { id: "up-3b", formType: "BW1B",  fileName: "บ.วศ.1ข_ML.pdf",          fileSize: 380000,  uploadedAt: "2024-07-05T09:00:00Z" },
        { id: "up-3c", formType: "B1C",   fileName: "บ.วศ.1ค_ML.pdf",          fileSize: 290000,  uploadedAt: "2024-07-15T09:00:00Z" },
        { id: "up-3d", formType: "B3",    fileName: "บ.3_ML.pdf",               fileSize: 450000,  uploadedAt: "2024-08-01T09:00:00Z" },
        { id: "up-3e", formType: "B4",    fileName: "บ.4_ML.pdf",               fileSize: 350000,  uploadedAt: "2024-09-01T09:00:00Z" },
        { id: "up-3f", formType: "THESIS",fileName: "วิทยานิพนธ์_ฉบับสมบูรณ์.pdf", fileSize: 5120000, uploadedAt: "2024-09-15T09:00:00Z" },
      ],
      workflowSteps: [
        { id: "sub-3-s1", stepOrder: 1, role: "STUDENT",               status: "APPROVED", actedAt: "2024-07-01T09:00:00Z", actedByName: "นายอานนท์ ใจดี" },
        { id: "sub-3-s2", stepOrder: 2, role: "ADMIN",                 status: "APPROVED", actedAt: "2024-07-08T10:00:00Z", actedByName: "พี่โบ้ (เจ้าหน้าที่ภาควิชา)" },
        { id: "sub-3-s3", stepOrder: 3, role: "PROGRAM_CHAIR",         status: "APPROVED", actedAt: "2024-07-15T14:00:00Z", actedByName: "รศ.ดร.นิพนธ์ วรรณโสภาคย์" },
        { id: "sub-3-s4", stepOrder: 4, role: "HEAD_EXAM_COMMITTEE",   status: "APPROVED", actedAt: "2024-07-22T09:00:00Z", actedByName: "รศ.ดร.จิรพงศ์ กสิวิทย์อำนวย", notes: "ผลงานดีเยี่ยม" },
        { id: "sub-3-s5", stepOrder: 5, role: "EXAM_COMMITTEE",        status: "APPROVED", actedAt: "2024-08-05T10:00:00Z", actedByName: "กรรมการสอบ 2 ท่าน", notes: "ผ่านการประเมิน", committeeMembers: COMMITTEE_IDS,
          committeeActions: [
            { userId: "u-prof-SCW", name: "ผศ.ดร.สัณหพศ จันทรานุวัฒน์", decision: "APPROVED", actedAt: "2024-08-04T11:00:00Z" },
            { userId: "u-prof-WSN", name: "ผศ.ดร.วีระยุทธ ศรีธุระวานิช", decision: "APPROVED", actedAt: "2024-08-05T10:00:00Z" },
          ] },
        { id: "sub-3-s6", stepOrder: 6, role: "ADVISOR",               status: "APPROVED", actedAt: "2024-08-10T14:00:00Z", actedByName: "รศ.ดร.วิชัย พงษ์สวัสดิ์" },
        { id: "sub-3-s7", stepOrder: 7, role: "INVITED_EXAM_COMMITTEE",status: "APPROVED", actedAt: "2024-09-03T10:00:00Z", actedByName: "ศ.ดร.วิบูลย์ แสงวีระพันธุ์ศิริ" },
        { id: "sub-3-s8", stepOrder: 8, role: "PROGRAM_CHAIR",         status: "APPROVED", actedAt: "2024-09-10T10:00:00Z", actedByName: "รศ.ดร.นิพนธ์ วรรณโสภาคย์", notes: "อนุมัติครบถ้วน ขอแสดงความยินดี" },
      ],
    },
  ];
}

// ─── Seed notifications (pre-loaded for demo) ─────────────────────────────────

function makeInitialNotifications(): MockNotification[] {
  return [
    {
      id: "n-1", recipientId: "u-prof-ASK", type: "pending",
      message: "รอการพิจารณาจากท่าน",
      detail: "การพัฒนาระบบตรวจสอบคุณภาพน้ำอัตโนมัติด้วย IoT",
      submissionId: "sub-1", isRead: false, createdAt: "2025-01-10T09:05:00Z",
    },
    {
      id: "n-2", recipientId: "u-committee2", type: "pending",
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
    {
      id: "n-4", recipientId: "u-admin", type: "approved",
      message: "คำร้องดำเนินการเสร็จสมบูรณ์",
      detail: "การวิเคราะห์ความเสี่ยงในตลาดหลักทรัพย์ด้วย Machine Learning",
      submissionId: "sub-3", isRead: false, createdAt: "2024-09-20T10:05:00Z",
    },
    {
      id: "n-5", recipientId: "u-admin", type: "info",
      message: "มีคำร้องกำลังดำเนินการ 2 รายการ",
      detail: "ติดตามภาพรวมได้ที่หน้าจัดการระบบ",
      submissionId: "sub-1", isRead: false, createdAt: "2025-01-10T09:10:00Z",
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
  createSubmission: (data: SubmissionFormData) => MockSubmission;
  approveCurrentStep: (submissionId: string, notes?: string) => void;
  rejectCurrentStep: (submissionId: string, notes: string) => void;
  addUpload: (submissionId: string, formType: FormType, fileName: string, fileSize: number) => void;
  getPendingCount: (role: Role) => number;
  studentResubmit: (submissionId: string) => void;
  committeeSign: (submissionId: string, decision: "APPROVED" | "REJECTED", notes?: string) => void;
  needsMyAction: (sub: MockSubmission) => boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemo: () => void;
  // Admin
  adminSetNote: (submissionId: string, note: string) => void;
  adminUpdateSubmission: (id: string, updates: { title?: string; advisorId?: string }) => void;
  adminDeleteSubmission: (id: string) => void;
  adminResetSubmission: (id: string) => void;
  adminOverrideStep: (submissionId: string, stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) => void;
  // Super Admin
  superAdminUpdateUserRole: (userId: string, newRole: Role) => void;
  superAdminDeleteUser: (userId: string) => void;
  superAdminAddUser: (userData: Omit<MockUser, "id">) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "thesis_mock_state_v11";

interface StoredState {
  userId: string | null;
  submissions: MockSubmission[];
  notifications: MockNotification[];
  users: MockUser[];
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { userId: null, submissions: makeInitial(), notifications: makeInitialNotifications(), users: MOCK_USERS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      return {
        ...parsed,
        notifications: parsed.notifications ?? makeInitialNotifications(),
        users: parsed.users ?? MOCK_USERS,
      };
    }
  } catch { /* ignore */ }
  return { userId: null, submissions: makeInitial(), notifications: makeInitialNotifications(), users: MOCK_USERS };
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

// Admin gets a copy of important events for oversight
function notifyAdmin(message: string, detail: string, submissionId: string, type: MockNotification["type"]): MockNotification | null {
  const admin = MOCK_USERS.find((u) => u.role === "ADMIN");
  if (!admin) return null;
  return makeNotif(admin.id, message, detail, submissionId, type);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId,        setUserId]        = useState<string | null>(null);
  const [submissions,   setSubmissions]   = useState<MockSubmission[]>([]);
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [users,         setUsers]         = useState<MockUser[]>([]);
  const [hydrated,      setHydrated]      = useState(false);

  useEffect(() => {
    const state = loadState();
    setUserId(state.userId);
    setSubmissions(state.submissions);
    setNotifications(state.notifications);
    setUsers(state.users);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ userId, submissions, notifications, users });
  }, [userId, submissions, notifications, users, hydrated]);

  const user = users.find((u) => u.id === userId) ?? null;
  const unreadCount = notifications.filter((n) => !n.isRead && n.recipientId === userId).length;

  // Notify helpers that close over current users state
  function notifyRoleInner(role: Role, message: string, detail: string, submissionId: string, type: MockNotification["type"]): MockNotification | null {
    const recipient = users.find((u) => u.role === role);
    if (!recipient) return null;
    return makeNotif(recipient.id, message, detail, submissionId, type);
  }
  function notifyAdminInner(message: string, detail: string, submissionId: string, type: MockNotification["type"]): MockNotification | null {
    const admin = users.find((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    if (!admin) return null;
    return makeNotif(admin.id, message, detail, submissionId, type);
  }

  function pushNotifs(notifs: (MockNotification | null)[]) {
    const valid = notifs.filter(Boolean) as MockNotification[];
    if (valid.length > 0) setNotifications((prev) => [...valid, ...prev]);
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  function login(id: string) { setUserId(id); }
  function logout() { setUserId(null); }

  // ─── Submission actions ────────────────────────────────────────────────────

  function createSubmission(data: SubmissionFormData): MockSubmission {
    const id  = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const committeeMembers = data.committeeIds?.length ? data.committeeIds : COMMITTEE_IDS;
    const sub: MockSubmission = {
      id,
      title: data.title,
      submissionType: data.submissionType,
      studentId: userId!,
      advisorId: data.advisorId,
      status: "IN_PROGRESS",
      createdAt: now,
      uploads: [],
      workflowSteps: WORKFLOW_ROLES.map((role, i) => ({
        id: `${id}-s${i + 1}`, stepOrder: i + 1, role, status: "PENDING" as const,
        ...(role === "EXAM_COMMITTEE" ? { committeeMembers } : {}),
      })),
      studentFullName: data.studentFullName,
      studentCode: data.studentCode,
      program: data.program,
      studentEmail: data.studentEmail,
      studentPhone: data.studentPhone,
      headCommitteeId: data.headCommitteeId,
      committeeIds: committeeMembers,
      invitedCommitteeId: data.invitedCommitteeId,
      examDate: data.examDate,
      examTime: data.examTime,
      roomNeeded: data.roomNeeded,
      parkingNeeded: data.parkingNeeded,
      carPlate: data.carPlate,
    };
    setSubmissions((prev) => [sub, ...prev]);

    // Notify advisor if assigned + admin oversight
    const notifs: (MockNotification | null)[] = [];
    if (data.advisorId) {
      const adv = users.find((u) => u.id === data.advisorId);
      if (adv) notifs.push(makeNotif(adv.id, "มีคำร้องใหม่รอการตรวจสอบ", data.title, id, "pending"));
    }
    notifs.push(notifyAdminInner("มีคำร้องวิทยานิพนธ์ใหม่", data.title, id, "info"));
    pushNotifs(notifs);
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
      notifs.push(notifyRoleInner(
        nextStep.role,
        `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`,
        sub.title, submissionId, "pending"
      ));
    }
    if (status === "COMPLETED") {
      notifs.push(makeNotif(sub.studentId, "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", sub.title, submissionId, "approved"));
      notifs.push(notifyAdminInner("คำร้องดำเนินการเสร็จสมบูรณ์", sub.title, submissionId, "approved"));
    }
    pushNotifs(notifs);

    // Send Finance email when Admin approves Phase 1 (stepOrder 2)
    const approvedStep = sub.workflowSteps[pendingIdx];
    if (approvedStep.stepOrder === 2 && approvedStep.role === "ADMIN") {
      fetch("/api/email/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: sub.studentFullName ?? sub.studentId,
          studentCode: sub.studentCode ?? "-",
          program: sub.program ? (PROGRAM_LABELS[sub.program] ?? sub.program) : "-",
          thesisTitle: sub.title,
          submissionId,
        }),
      }).catch((err) => console.error("Finance email failed:", err));
    }
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

    // Notify student + admin oversight
    pushNotifs([
      makeNotif(sub.studentId, `คำร้องถูกปฏิเสธ — กรุณาตรวจสอบและแก้ไข`, sub.title, submissionId, "rejected"),
      notifyAdminInner("มีคำร้องถูกปฏิเสธ", sub.title, submissionId, "rejected"),
    ]);
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
      pushNotifs([
        makeNotif(sub.studentId, "กรรมการสอบไม่อนุมัติ — กรุณาตรวจสอบและแก้ไข", sub.title, submissionId, "rejected"),
        notifyAdminInner("กรรมการสอบไม่อนุมัติคำร้อง", sub.title, submissionId, "rejected"),
      ]);
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
      notifs.push(notifyRoleInner(nextStep.role, `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`, sub.title, submissionId, "pending"));
    }
    if (status === "COMPLETED") {
      notifs.push(makeNotif(sub.studentId, "วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน 🎉", sub.title, submissionId, "approved"));
      notifs.push(notifyAdminInner("คำร้องดำเนินการเสร็จสมบูรณ์", sub.title, submissionId, "approved"));
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
    pushNotifs([notifyRoleInner(rejectedStep.role, "นักศึกษาแก้ไขและยื่นคำร้องใหม่แล้ว", sub.title, submissionId, "info")]);
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

  // Reset all demo data back to the seed (handy before a live demo)
  function resetDemo() {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    setSubmissions(makeInitial());
    setNotifications(makeInitialNotifications());
    setUsers(MOCK_USERS);
  }

  // ─── Super Admin actions ───────────────────────────────────────────────────

  function superAdminUpdateUserRole(userId: string, newRole: Role) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  }

  function superAdminDeleteUser(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function superAdminAddUser(userData: Omit<MockUser, "id">) {
    const newUser: MockUser = { ...userData, id: `u-${Date.now()}` };
    setUsers((prev) => [...prev, newUser]);
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
        pushNotifs([notifyRoleInner(nextStep.role, `ถึงคิวของท่าน: ${STEP_NAMES[nextStep.stepOrder] ?? ROLE_LABELS[nextStep.role]}`, sub.title, submissionId, "pending")]);
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
      user, users, submissions, notifications, unreadCount,
      login, logout, createSubmission, approveCurrentStep, rejectCurrentStep,
      addUpload, getPendingCount, studentResubmit,
      committeeSign, needsMyAction,
      markNotificationRead, markAllNotificationsRead, resetDemo,
      adminSetNote, adminUpdateSubmission, adminDeleteSubmission,
      adminResetSubmission, adminOverrideStep,
      superAdminUpdateUserRole, superAdminDeleteUser, superAdminAddUser,
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
