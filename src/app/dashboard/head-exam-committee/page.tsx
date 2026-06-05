"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function HeadExamCommitteeDashboard() {
  return <RolePendingList role="HEAD_EXAM_COMMITTEE" title="รายการรออนุมัติ — ประธานกรรมการสอบ" basePath="/dashboard/head-exam-committee" />;
}
