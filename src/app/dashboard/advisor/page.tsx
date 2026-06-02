"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function AdvisorDashboard() {
  return <RolePendingList role="ADVISOR" title="รายการรออนุมัติ — อาจารย์ที่ปรึกษา" basePath="/dashboard/advisor" />;
}
