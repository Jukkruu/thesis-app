"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function DeptStaffDashboard() {
  return <RolePendingList role="DEPT_STAFF" title="รายการรออนุมัติ — เจ้าหน้าที่ภาควิชา" basePath="/dashboard/dept-staff" />;
}
