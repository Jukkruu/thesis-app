"use client";

import { cn } from "@/lib/utils";
import { StepStatus, SubmissionStatus } from "@/types";

const submissionStyles: Record<SubmissionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const stepStyles: Record<StepStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-500",
};

const submissionLabels: Record<SubmissionStatus, string> = {
  DRAFT: "ร่าง",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิกแล้ว",
};

const stepLabels: Record<StepStatus, string> = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  SKIPPED: "ข้าม",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", submissionStyles[status])}>
      {submissionLabels[status]}
    </span>
  );
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", stepStyles[status])}>
      {stepLabels[status]}
    </span>
  );
}
