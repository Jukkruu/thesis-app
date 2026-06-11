"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABELS, ROLE_DESC } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/config";
import { Role } from "@/types";
import {
  Users, GraduationCap, BookOpen, Building2, ClipboardList,
  Briefcase, School, ShieldCheck, ChevronRight, RotateCcw, Crown,
} from "lucide-react";

const ROLE_ICON: Record<Role, React.ReactNode> = {
  SUPER_ADMIN:            <Crown         className="w-5 h-5 text-amber-500" />,
  ADMIN:                  <ShieldCheck   className="w-5 h-5 text-orange-500" />,
  STUDENT:                <GraduationCap className="w-5 h-5 text-blue-500" />,
  ADVISOR:                <BookOpen      className="w-5 h-5 text-purple-500" />,
  PROGRAM_CHAIR:          <Building2     className="w-5 h-5 text-indigo-500" />,
  HEAD_EXAM_COMMITTEE:    <ClipboardList className="w-5 h-5 text-orange-600" />,
  EXAM_COMMITTEE:         <ClipboardList className="w-5 h-5 text-amber-500" />,
  INVITED_EXAM_COMMITTEE: <ClipboardList className="w-5 h-5 text-pink-500" />,
  DEPT_STAFF:             <Briefcase     className="w-5 h-5 text-teal-500" />,
  FACULTY_DEAN:           <School        className="w-5 h-5 text-red-500" />,
  GRADUATE_SCHOOL:        <GraduationCap className="w-5 h-5 text-green-500" />,
};

const ROLE_COLOR: Record<Role, string> = {
  SUPER_ADMIN:            "bg-amber-50 border-amber-100 hover:border-amber-300",
  ADMIN:                  "bg-orange-50 border-orange-100 hover:border-orange-300",
  STUDENT:                "bg-blue-50 border-blue-100 hover:border-blue-300",
  ADVISOR:                "bg-purple-50 border-purple-100 hover:border-purple-300",
  PROGRAM_CHAIR:          "bg-indigo-50 border-indigo-100 hover:border-indigo-300",
  HEAD_EXAM_COMMITTEE:    "bg-orange-50 border-orange-100 hover:border-orange-300",
  EXAM_COMMITTEE:         "bg-amber-50 border-amber-100 hover:border-amber-300",
  INVITED_EXAM_COMMITTEE: "bg-pink-50 border-pink-100 hover:border-pink-300",
  DEPT_STAFF:             "bg-teal-50 border-teal-100 hover:border-teal-300",
  FACULTY_DEAN:           "bg-red-50 border-red-100 hover:border-red-300",
  GRADUATE_SCHOOL:        "bg-green-50 border-green-100 hover:border-green-300",
};

export default function AdminUsersPage() {
  const { submissions, users: allUsers } = useApp();
  const { showToast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

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
        {allUsers.map((u) => (
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
                {/* Role chip — inline on mobile only */}
                <span className="sm:hidden text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5 truncate">{u.email}</p>
              <p className="text-gray-400 text-xs mt-1">{ROLE_DESC[u.role]}</p>
              {/* Stats — inline on mobile only */}
              <p className="sm:hidden text-xs text-gray-500 mt-1">{getStats(u.id, u.role)}</p>
            </div>

            {/* Right — desktop only */}
            <div className="hidden sm:flex text-right shrink-0 space-y-1.5 flex-col items-end">
              <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                {ROLE_LABELS[u.role]}
              </span>
              <p className="text-xs text-gray-500">{getStats(u.id, u.role)}</p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Demo tools — hidden when NEXT_PUBLIC_DEMO_MODE="false" */}
      {DEMO_MODE && (
      <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-amber-700">เครื่องมือสำหรับสาธิต</h2>
        </div>
        <p className="text-sm text-gray-500">
          รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น — ใช้ก่อนเริ่มสาธิตระบบ (ลบคำร้องและการแจ้งเตือนที่สร้างระหว่างทดสอบ)
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-amber-200 text-amber-700 font-medium rounded-xl hover:bg-amber-50 transition"
          >
            <RotateCcw className="w-4 h-4" />
            รีเซ็ตข้อมูลทดสอบ
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-amber-700 font-medium text-center">ยืนยันการรีเซ็ต? ข้อมูลที่สร้างไว้จะหายทั้งหมด</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmReset(false); showToast("ฟีเจอร์นี้ไม่รองรับในโหมดฐานข้อมูลจริง", "error"); }}
                className="flex-1 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition"
              >
                ยืนยันรีเซ็ต
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
