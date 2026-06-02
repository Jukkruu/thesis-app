"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function FacultyDeanDashboard() {
  return <RolePendingList role="FACULTY_DEAN" title="รายการรออนุมัติ — คณบดี" basePath="/dashboard/faculty-dean" />;
}
