"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function CoAdvisorDashboard() {
  return <RolePendingList role="CO_ADVISOR" title="รายการรออนุมัติ — อาจารย์ที่ปรึกษาร่วม" basePath="/dashboard/co-advisor" />;
}
