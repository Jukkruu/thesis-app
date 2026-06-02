"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/types";

const ROLE_COLORS: Record<Role, string> = {
  STUDENT: "bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100",
  ADVISOR: "bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100",
  PROGRAM_CHAIR: "bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100",
  EXAM_COMMITTEE: "bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100",
  DEPT_STAFF: "bg-teal-50 border-teal-200 hover:border-teal-400 hover:bg-teal-100",
  FACULTY_DEAN: "bg-red-50 border-red-200 hover:border-red-400 hover:bg-red-100",
  GRADUATE_SCHOOL: "bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100",
};

const ROLE_ICON: Record<Role, string> = {
  STUDENT: "🎓",
  ADVISOR: "👨‍🏫",
  PROGRAM_CHAIR: "🏛️",
  EXAM_COMMITTEE: "📋",
  DEPT_STAFF: "🗂️",
  FACULTY_DEAN: "🏫",
  GRADUATE_SCHOOL: "🎯",
};

export default function LoginPage() {
  const { user, login } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role]);
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
          <p className="text-gray-500 mt-2">เลือกบทบาทเพื่อเข้าสู่ระบบ (Mockup Demo)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                login(u.id);
                router.push(ROLE_ROUTES[u.role]);
              }}
              className={`text-left p-5 rounded-2xl border-2 transition-all duration-150 ${ROLE_COLORS[u.role]}`}
            >
              <div className="text-3xl mb-3">{ROLE_ICON[u.role]}</div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {ROLE_LABELS[u.role]}
              </p>
              <p className="font-semibold text-gray-900 text-sm leading-snug">{u.name}</p>
              {u.studentId && (
                <p className="text-xs text-gray-500 mt-1">รหัส: {u.studentId}</p>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          นี่คือ Mockup Demo — ข้อมูลถูกเก็บใน localStorage เท่านั้น
        </p>
      </div>
    </div>
  );
}
