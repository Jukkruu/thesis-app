"use client";
import { RolePendingList } from "@/components/RolePendingList";

export default function ProgramChairDashboard() {
  return <RolePendingList role="PROGRAM_CHAIR" title="รายการรออนุมัติ — ประธานหลักสูตร" basePath="/dashboard/program-chair" />;
}
