"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function InvitedExamCommitteeDashboard() {
  return <RolePendingList role="INVITED_EXAM_COMMITTEE" title="รายการรออนุมัติ — กรรมการภายนอก" basePath="/dashboard/invited-exam-committee" />;
}
