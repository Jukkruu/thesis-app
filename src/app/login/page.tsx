"use client";

import { useState, useEffect } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_DESC, ROLE_EMOJI, ROLE_GRADIENT, STEP_NAMES } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, GraduationCap, Sparkles, ChevronRight } from "lucide-react";
import { Role } from "@/types";

const WORKFLOW_STEPS: { order: number; role: Role }[] = [
  { order: 1, role: "STUDENT" },
  { order: 2, role: "ADVISOR" },
  { order: 3, role: "PROGRAM_CHAIR" },
  { order: 4, role: "DEPT_STAFF" },
  { order: 5, role: "EXAM_COMMITTEE" },
  { order: 6, role: "ADVISOR" },
  { order: 7, role: "FACULTY_DEAN" },
  { order: 8, role: "GRADUATE_SCHOOL" },
];

export default function LoginPage() {
  const { user, login } = useApp();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role]);
  }, [user, router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const found = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());
    if (!found) { setError("ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง"); return; }
    if (!password.trim()) { setError("กรุณาใส่รหัสผ่าน"); return; }
    login(found.id);
    router.push(ROLE_ROUTES[found.role]);
  }

  function quickLogin(userId: string, role: Role) {
    login(userId);
    router.push(ROLE_ROUTES[role]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-gray-50 to-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-8">

        {/* Hero header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
            <p className="text-gray-500 mt-1.5">คณะวิศวกรรมศาสตร์ · ยื่น ติดตาม และลงนามเอกสารออนไลน์</p>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* LEFT — login + demo */}
          <div className="space-y-6">
            {/* Login form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 text-lg">เข้าสู่ระบบ</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">อีเมล</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                      placeholder="รหัสผ่าน"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition text-base shadow-sm"
                >
                  <LogIn className="w-5 h-5" />
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>

            {/* Demo shortcuts */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold uppercase tracking-wide">
                  ทดสอบระบบ — คลิกเข้าใช้งานตามบทบาท
                </p>
              </div>

              <div className="space-y-2">
                {MOCK_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => quickLogin(u.id, u.role)}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-transparent hover:shadow-md transition text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLE_GRADIENT[u.role]} flex items-center justify-center shrink-0 text-lg`}>
                      {ROLE_EMOJI[u.role]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                      <p className="text-sm text-gray-500 truncate">{ROLE_LABELS[u.role]}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition shrink-0" />
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center pt-1">
                ข้อมูลทดสอบ — บันทึกใน localStorage เท่านั้น
              </p>
            </div>
          </div>

          {/* RIGHT — workflow */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-6">
            <div className="mb-6">
              <h2 className="font-bold text-gray-900 text-xl">ขั้นตอนการอนุมัติ</h2>
              <p className="text-sm text-gray-500 mt-1">
                เอกสารส่งต่ออัตโนมัติเมื่อแต่ละฝ่ายลงนาม — 8 ขั้นตอน
              </p>
            </div>

            <ol className="relative">
              {WORKFLOW_STEPS.map((step, i) => (
                <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Vertical connector line */}
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <span className="absolute left-5 top-11 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-gray-100" />
                  )}
                  {/* Number badge with role color */}
                  <div className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_GRADIENT[step.role]} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-sm font-bold text-white">{step.order}</span>
                  </div>
                  {/* Step content */}
                  <div className="flex items-center gap-2 min-w-0 pt-1.5">
                    <span className="text-xl shrink-0">{ROLE_EMOJI[step.role]}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 leading-snug">{STEP_NAMES[step.order]}</p>
                      <p className="text-xs text-gray-400">{ROLE_LABELS[step.role]}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-2 flex items-center gap-3 text-sm font-medium text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl px-4 py-3">
              <span className="text-xl">🎉</span>
              ครบทุกขั้นตอน = วิทยานิพนธ์อนุมัติสมบูรณ์
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
