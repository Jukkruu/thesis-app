"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function GraduateSchoolDashboard() {
  return <RolePendingList role="GRADUATE_SCHOOL" title="รายการรออนุมัติ — บัณฑิตวิทยาลัย" basePath="/dashboard/graduate-school" />;
}
