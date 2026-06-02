"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function ExamCommitteeDashboard() {
  return <RolePendingList role="EXAM_COMMITTEE" title="รายการรออนุมัติ — กรรมการสอบ" basePath="/dashboard/exam-committee" />;
}
