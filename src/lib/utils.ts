import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FormType, Role, StepStatus, SubmissionStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FORM_LABELS: Record<FormType, string> = {
  BW1A:  "บ.วศ.1ก — เสนอหัวข้อวิทยานิพนธ์",
  BW1B:  "บ.วศ.1ข — อนุมัติหัวข้อวิทยานิพนธ์",
  B1C:   "บ.วศ.1ค — รายงานความก้าวหน้า",
  B1D:   "บ.วศ.1ง — รายงานความก้าวหน้า (2)",
  B2:    "บ.2 — ออกหนังสือเชิญกรรมการ",
  B3:    "บ.3 — ประเมินวิทยานิพนธ์ก่อนสอบ",
  B4:    "บ.4 — ลงนามอนุมัติวิทยานิพนธ์",
  THESIS:"วิทยานิพนธ์ฉบับสมบูรณ์",
  SIGNED:"เอกสารลงนาม",
};

export const PROGRAM_LABELS: Record<string, string> = {
  PHD:     "ป.เอก สาขาวิศวกรรมเครื่องกล",
  ME_MECH: "ป.โท สาขาเครื่องกล",
  ME_CPS:  "ป.โท สาขา CPS",
};

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT:               "นักศึกษา",
  ADVISOR:               "อาจารย์ที่ปรึกษา",
  PROGRAM_CHAIR:         "ประธานหลักสูตร",
  HEAD_EXAM_COMMITTEE:   "ประธานกรรมการสอบ",
  EXAM_COMMITTEE:        "กรรมการสอบ",
  INVITED_EXAM_COMMITTEE:"กรรมการภายนอก",
  DEPT_STAFF:            "เจ้าหน้าที่ภาควิชา",
  FACULTY_DEAN:          "คณบดี",
  GRADUATE_SCHOOL:       "บัณฑิตวิทยาลัย",
  ADMIN:                 "ผู้ดูแลระบบ",
  SUPER_ADMIN:           "ผู้ดูแลระบบสูงสุด",
};

// Emoji per role — kept as full static values so Tailwind never purges anything
export const ROLE_EMOJI: Record<Role, string> = {
  STUDENT:               "🎓",
  ADVISOR:               "👨‍🏫",
  PROGRAM_CHAIR:         "🏛️",
  HEAD_EXAM_COMMITTEE:   "⭐",
  EXAM_COMMITTEE:        "📋",
  INVITED_EXAM_COMMITTEE:"🔏",
  DEPT_STAFF:            "🗂️",
  FACULTY_DEAN:          "🏫",
  GRADUATE_SCHOOL:       "🎯",
  ADMIN:                 "🛡️",
  SUPER_ADMIN:           "👑",
};

// Gradient (for headers / banners) per role — static strings for Tailwind
export const ROLE_GRADIENT: Record<Role, string> = {
  STUDENT:               "from-blue-500 to-indigo-600",
  ADVISOR:               "from-violet-500 to-purple-600",
  PROGRAM_CHAIR:         "from-indigo-500 to-blue-600",
  HEAD_EXAM_COMMITTEE:   "from-orange-500 to-amber-600",
  EXAM_COMMITTEE:        "from-amber-400 to-orange-500",
  INVITED_EXAM_COMMITTEE:"from-pink-500 to-rose-600",
  DEPT_STAFF:            "from-teal-500 to-emerald-600",
  FACULTY_DEAN:          "from-rose-500 to-red-600",
  GRADUATE_SCHOOL:       "from-emerald-500 to-green-600",
  ADMIN:                 "from-slate-700 to-gray-900",
  SUPER_ADMIN:           "from-yellow-400 to-amber-600",
};

export const ROLE_DESC: Record<Role, string> = {
  STUDENT:               "ยื่นหัวข้อ อัปโหลดเอกสาร ติดตามสถานะ",
  ADVISOR:               "ตรวจสอบและอนุมัติหัวข้อ ลงนามเอกสาร",
  PROGRAM_CHAIR:         "ลงนามในระยะที่ 1 2 3 และ 5",
  HEAD_EXAM_COMMITTEE:   "ลงนามก่อนกรรมการสอบ — ระยะที่ 2 3 และ 5",
  EXAM_COMMITTEE:        "ลงนามประเมินวิทยานิพนธ์ตามลำดับ",
  INVITED_EXAM_COMMITTEE:"กรรมการภายนอก ลงนามเฉพาะระยะที่ 5",
  DEPT_STAFF:            "ออกหนังสือเชิญกรรมการสอบ (บ.2)",
  FACULTY_DEAN:          "อนุมัติวิทยานิพนธ์ระดับคณะ (บ.4)",
  GRADUATE_SCHOOL:       "รับวิทยานิพนธ์ฉบับสมบูรณ์",
  ADMIN:                 "ดูภาพรวมและจัดการคำร้องทั้งหมด",
  SUPER_ADMIN:           "ควบคุมระบบทั้งหมด รวมถึงการจัดการผู้ใช้และสิทธิ์",
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: "ร่าง",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิก",
};

export const STEP_LABELS: Record<StepStatus, string> = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  SKIPPED: "ข้าม",
};

export const FORM_SHORT: Record<FormType, string> = {
  BW1A:   "บ.วศ.1ก",
  BW1B:   "บ.วศ.1ข",
  B1C:    "บ.วศ.1ค",
  B1D:    "บ.วศ.1ง",
  B2:     "บ.2",
  B3:     "บ.3",
  B4:     "บ.4",
  THESIS: "วิทยานิพนธ์",
  SIGNED: "เอกสารลงนาม",
};

// Step names for proposal submissions (9 steps)
export const PROPOSAL_STEP_NAMES: Record<number, string> = {
  1: "นิสิตอัปโหลด บ.วศ.1ก + บ.วศ.1ข",
  2: "เจ้าหน้าที่ตรวจรับและอนุมัติ",
  3: "ประธานหลักสูตรลงนาม บ.วศ.1ก",
  4: "นิสิตอัปโหลด บ.วศ.1ค + บ.วศ.1ง",
  5: "ประธานกรรมการสอบลงนาม บ.วศ.1ค",
  6: "อาจารย์ที่ปรึกษาลงนาม บ.วศ.1ค",
  7: "กรรมการสอบลงนาม บ.วศ.1ค",
  8: "เจ้าหน้าที่ตรวจสอบ (รอบ 2)",
  9: "ประธานหลักสูตรลงนาม บ.วศ.1ค + บ.วศ.1ง",
};

// Step names for thesis defense submissions (18 steps)
export const THESIS_STEP_NAMES: Record<number, string> = {
  1:  "นิสิตอัปโหลด บ.2 + บ.3",
  2:  "กรรมการสอบลงนาม บ.3",
  3:  "อาจารย์ที่ปรึกษาลงนาม บ.2",
  4:  "ประธานกรรมการสอบลงนาม บ.2",
  5:  "ประธานหลักสูตรลงนาม บ.2",
  6:  "เจ้าหน้าที่นำส่งและรับเอกสารจากคณะ",
  7:  "นิสิตอัปโหลดเอกสารหลังสอบ",
  8:  "ประธานกรรมการสอบลงนาม ใบรายงานผล",
  9:  "อาจารย์ที่ปรึกษาลงนาม",
  10: "กรรมการสอบลงนาม ใบรายงานผล",
  11: "กรรมการภายนอกลงนาม ใบรายงานผล",
  12: "ประธานหลักสูตรลงนาม ใบรายงานผล",
  13: "นิสิตอัปโหลด บ.4 + วิทยานิพนธ์",
  14: "ประธานหลักสูตรลงนาม บ.4",
  15: "ประธานกรรมการสอบลงนามปกวิทยานิพนธ์",
  16: "อาจารย์ที่ปรึกษาลงนามปกวิทยานิพนธ์",
  17: "กรรมการสอบลงนามปกวิทยานิพนธ์",
  18: "กรรมการภายนอกลงนามปกวิทยานิพนธ์",
};

// Legacy alias so old import sites compile (old 8/27-step subs fall back to role label)
export const STEP_NAMES: Record<number, string> = PROPOSAL_STEP_NAMES;

export function getStepName(stepOrder: number, submissionType?: string | null): string {
  const map = submissionType === "THESIS_DEFENSE" ? THESIS_STEP_NAMES : PROPOSAL_STEP_NAMES;
  return map[stepOrder] ?? "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function downloadMockFile(fileName: string, formLabel: string, submissionTitle: string) {
  const content = [
    `=== เอกสารสาธิต ===`,
    `แบบฟอร์ม: ${formLabel}`,
    `ชื่อวิทยานิพนธ์: ${submissionTitle}`,
    `ไฟล์: ${fileName}`,
    ``,
    `[ในระบบจริง ไฟล์ต้นฉบับจะถูกดาวน์โหลดจาก Storage]`,
  ].join("\n");

  const blob = new Blob(["﻿" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(/\.pdf$/i, ".txt");
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFile(uploadId: string, fileName: string, formLabel: string, submissionTitle: string, fileUrl?: string | null) {
  if (fileUrl) {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  downloadMockFile(fileName, formLabel, submissionTitle);
}
