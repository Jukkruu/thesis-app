import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FormType, Role, StepStatus, SubmissionStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FORM_LABELS: Record<FormType, string> = {
  BW1A: "บ.วศ.1ก — เสนอหัวข้อวิทยานิพนธ์",
  BW1B: "บ.วศ.1ข — อนุมัติหัวข้อวิทยานิพนธ์",
  B2: "บ.2 — ออกหนังสือเชิญกรรมการ",
  B3: "บ.3 — ประเมินวิทยานิพนธ์ก่อนสอบ",
  B4: "บ.4 — ลงนามอนุมัติวิทยานิพนธ์",
  THESIS: "วิทยานิพนธ์ฉบับสมบูรณ์",
  SIGNED: "เอกสารลงนาม",
};

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "นักศึกษา",
  ADVISOR: "อาจารย์ที่ปรึกษา",
  PROGRAM_CHAIR: "ประธานหลักสูตร",
  EXAM_COMMITTEE: "กรรมการสอบ",
  DEPT_STAFF: "เจ้าหน้าที่ภาควิชา",
  FACULTY_DEAN: "คณบดี",
  GRADUATE_SCHOOL: "บัณฑิตวิทยาลัย",
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: "ร่าง",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ถูกปฏิเสธ",
};

export const STEP_LABELS: Record<StepStatus, string> = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  SKIPPED: "ข้าม",
};

export const STEP_NAMES: Record<number, string> = {
  1: "นักศึกษายื่นเอกสาร",
  2: "อาจารย์ที่ปรึกษาตรวจสอบ",
  3: "ประธานหลักสูตรอนุมัติ",
  4: "เจ้าหน้าที่ออกหนังสือเชิญ",
  5: "กรรมการสอบประเมิน",
  6: "อาจารย์ที่ปรึกษาลงนาม บ.3",
  7: "คณบดีอนุมัติ บ.4",
  8: "บัณฑิตวิทยาลัยรับวิทยานิพนธ์",
};

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
