"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_DESC } from "@/lib/utils";
import { Role } from "@/types";
import { Users, GraduationCap, BookOpen, Building2, ClipboardList, Briefcase, School, ShieldCheck } from "lucide-react";

const ROLE_ICON: Record<Role, React.ReactNode> = {
  ADMIN:          <ShieldCheck className="w-5 h-5 text-orange-500" />,
  STUDENT:        <GraduationCap className="w-5 h-5 text-blue-500" />,
  ADVISOR:        <BookOpen className="w-5 h-5 text-purple-500" />,
  PROGRAM_CHAIR:  <Building2 className="w-5 h-5 text-indigo-500" />,
  EXAM_COMMITTEE: <ClipboardList className="w-5 h-5 text-orange-500" />,
  DEPT_STAFF:     <Briefcase className="w-5 h-5 text-teal-500" />,
  FACULTY_DEAN:   <School className="w-5 h-5 text-red-500" />,
  GRADUATE_SCHOOL:<GraduationCap className="w-5 h-5 text-green-500" />,
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN:          "bg-orange-50 border-orange-100",
  STUDENT:        "bg-blue-50 border-blue-100",
  ADVISOR:        "bg-purple-50 border-purple-100",
  PROGRAM_CHAIR:  "bg-indigo-50 border-indigo-100",
  EXAM_COMMITTEE: "bg-orange-50 border-orange-100",
  DEPT_STAFF:     "bg-teal-50 border-teal-100",
  FACULTY_DEAN:   "bg-red-50 border-red-100",
  GRADUATE_SCHOOL:"bg-green-50 border-green-100",
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
      const related = submissions.filter((s) =>
        s.advisorId === userId ||
        s.workflowSteps.some((st) => st.role === "ADVISOR" && st.actedByName)
      );
      return `เกี่ยวข้อง ${related.length} คำร้อง`;
    }
    const acted = submissions.filter((s) =>
      s.workflowSteps.some((st) => st.role === role && (st.status === "APPROVED" || st.status === "REJECTED"))
    );
    if (acted.length === 0) return "ยังไม่มีการดำเนินการ";
    return `ดำเนินการแล้ว ${acted.length} คำร้อง`;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ใช้งานในระบบ</h1>
          <p className="text-gray-500 mt-0.5">{MOCK_USERS.length} บัญชีทั้งหมด</p>
        </div>
      </div>

      {/* User cards */}
      <div className="space-y-3">
        {MOCK_USERS.map((u) => (
          <div
            key={u.id}
            className={`flex items-center gap-4 p-5 rounded-2xl border ${ROLE_COLOR[u.role]}`}
          >
            {/* Role icon */}
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

            {/* Role badge + stats */}
            <div className="text-right shrink-0 space-y-1.5">
              <span className="inline-block text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                {ROLE_LABELS[u.role]}
              </span>
              <p className="text-xs text-gray-400">{getStats(u.id, u.role)}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        * ระบบนี้เป็น Mockup — ข้อมูลผู้ใช้กำหนดไว้ล่วงหน้าเพื่อการทดสอบ
      </p>
    </div>
  );
}
