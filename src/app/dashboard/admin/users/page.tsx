"use client";

import Link from "next/link";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_DESC } from "@/lib/utils";
import { Role } from "@/types";
import {
  Users, GraduationCap, BookOpen, Building2, ClipboardList,
  Briefcase, School, ShieldCheck, ChevronRight,
} from "lucide-react";

const ROLE_ICON: Record<Role, React.ReactNode> = {
  ADMIN:           <ShieldCheck  className="w-5 h-5 text-orange-500" />,
  STUDENT:         <GraduationCap className="w-5 h-5 text-blue-500" />,
  ADVISOR:         <BookOpen     className="w-5 h-5 text-purple-500" />,
  PROGRAM_CHAIR:   <Building2    className="w-5 h-5 text-indigo-500" />,
  EXAM_COMMITTEE:  <ClipboardList className="w-5 h-5 text-orange-500" />,
  DEPT_STAFF:      <Briefcase    className="w-5 h-5 text-teal-500" />,
  FACULTY_DEAN:    <School       className="w-5 h-5 text-red-500" />,
  GRADUATE_SCHOOL: <GraduationCap className="w-5 h-5 text-green-500" />,
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN:           "bg-orange-50 border-orange-100 hover:border-orange-300",
  STUDENT:         "bg-blue-50 border-blue-100 hover:border-blue-300",
  ADVISOR:         "bg-purple-50 border-purple-100 hover:border-purple-300",
  PROGRAM_CHAIR:   "bg-indigo-50 border-indigo-100 hover:border-indigo-300",
  EXAM_COMMITTEE:  "bg-orange-50 border-orange-100 hover:border-orange-300",
  DEPT_STAFF:      "bg-teal-50 border-teal-100 hover:border-teal-300",
  FACULTY_DEAN:    "bg-red-50 border-red-100 hover:border-red-300",
  GRADUATE_SCHOOL: "bg-green-50 border-green-100 hover:border-green-300",
};

export default function AdminUsersPage() {
  const { submissions } = useApp();

  function getStats(userId: string, role: Role) {
    if (role === "STUDENT") {
      const mine = submissions.filter((s) => s.studentId === userId);
      const done = mine.filter((s) => s.status === "COMPLETED").length;
      return `${mine.length} คำร้อง · เสร็จสิ้น ${done}`;
    }
    if (role === "ADVISOR") {
      const related = submissions.filter((s) => s.advisorId === userId);
      return `ที่ปรึกษา ${related.length} คำร้อง`;
    }
    if (role === "ADMIN") return "เข้าถึงได้ทุกรายการ";
    const acted = submissions.filter((s) =>
      s.workflowSteps.some(
        (st) => st.role === role && (st.status === "APPROVED" || st.status === "REJECTED")
      )
    );
    const pending = submissions.filter((s) =>
      s.workflowSteps.find((st) => st.status === "PENDING")?.role === role
    );
    if (pending.length > 0) return `รอดำเนินการ ${pending.length} · ทำแล้ว ${acted.length}`;
    if (acted.length === 0) return "ยังไม่มีการดำเนินการ";
    return `ดำเนินการแล้ว ${acted.length} คำร้อง`;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ใช้งานในระบบ</h1>
          <p className="text-gray-500 mt-0.5">คลิกที่ผู้ใช้เพื่อดูรายละเอียดและคำร้องที่เกี่ยวข้อง</p>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_USERS.map((u) => (
          <Link
            key={u.id}
            href={`/dashboard/admin/users/${u.id}`}
            className={`flex items-center gap-4 p-5 rounded-2xl border transition ${ROLE_COLOR[u.role]}`}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
              {ROLE_ICON[u.role]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-lg">{u.name}</p>
                {u.studentId && (
                  <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                    รหัส {u.studentId}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{u.email}</p>
              <p className="text-gray-400 text-xs mt-1">{ROLE_DESC[u.role]}</p>
            </div>

            {/* Right */}
            <div className="text-right shrink-0 space-y-1.5 flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                {ROLE_LABELS[u.role]}
              </span>
              <p className="text-xs text-gray-500">{getStats(u.id, u.role)}</p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
