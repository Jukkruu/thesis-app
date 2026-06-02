"use client";

import { useState, useEffect } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_EMOJI, ROLE_GRADIENT } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, GraduationCap, Sparkles, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { Role } from "@/types";

// ─── Workflow as 5 phases (matches the official process diagram) ───────────────

interface Step { emoji: string; label: string; role: string; }
interface Phase { no: number; title: string; steps: Step[]; }

const PHASES: Phase[] = [
  {
    no: 1, title: "เสนอหัวข้อโครงร่างวิทยานิพนธ์",
    steps: [
      { emoji: "🎓", label: "ยื่น บ.วศ.1ก", role: "นักศึกษา" },
      { emoji: "👨‍🏫", label: "ตรวจสอบหัวข้อ", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "🏛️", label: "อนุมัติหัวข้อ", role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 2, title: "แต่งตั้งคณะกรรมการสอบ",
    steps: [
      { emoji: "🗂️", label: "ออกหนังสือเชิญ บ.2", role: "เจ้าหน้าที่ภาควิชา" },
    ],
  },
  {
    no: 3, title: "ประเมินวิทยานิพนธ์ก่อนสอบ",
    steps: [
      { emoji: "📋", label: "ประเมิน บ.3", role: "กรรมการสอบ" },
    ],
  },
  {
    no: 4, title: "สอบป้องกันและลงนามวิทยานิพนธ์",
    steps: [
      { emoji: "👨‍🏫", label: "ลงนาม บ.3", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "🏫", label: "อนุมัติ บ.4", role: "คณบดี" },
    ],
  },
  {
    no: 5, title: "อนุมัติสำเร็จการศึกษา",
    steps: [
      { emoji: "🎯", label: "รับวิทยานิพนธ์ฉบับสมบูรณ์", role: "บัณฑิตวิทยาลัย" },
    ],
  },
];

// Static color classes per phase (Tailwind-safe)
const PHASE_THEME = [
  { bar: "bg-blue-500",   tint: "bg-blue-50",   badge: "bg-blue-500",   ring: "ring-blue-100" },
  { bar: "bg-teal-500",   tint: "bg-teal-50",   badge: "bg-teal-500",   ring: "ring-teal-100" },
  { bar: "bg-amber-500",  tint: "bg-amber-50",  badge: "bg-amber-500",  ring: "ring-amber-100" },
  { bar: "bg-purple-500", tint: "bg-purple-50", badge: "bg-purple-500", ring: "ring-purple-100" },
  { bar: "bg-rose-500",   tint: "bg-rose-50",   badge: "bg-rose-500",   ring: "ring-rose-100" },
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

        {/* Login + demo */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
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
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
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
              <p className="text-sm font-semibold uppercase tracking-wide">ทดสอบระบบ — คลิกเข้าใช้ตามบทบาท</p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
          </div>
        </div>

        {/* WORKFLOW — 5 phases */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="text-center mb-7">
            <h2 className="font-bold text-gray-900 text-xl sm:text-2xl">ขั้นตอนการทำวิทยานิพนธ์</h2>
            <p className="text-sm text-gray-500 mt-1">5 ระยะ · เอกสารส่งต่ออัตโนมัติเมื่อแต่ละฝ่ายลงนาม</p>
          </div>

          <div className="space-y-3">
            {PHASES.map((phase, pi) => {
              const t = PHASE_THEME[pi];
              return (
                <div key={phase.no}>
                  {/* Phase lane */}
                  <div className={`relative ${t.tint} rounded-2xl p-4 sm:p-5 overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.bar}`} />

                    {/* Phase title */}
                    <div className="flex items-center gap-3 mb-3 pl-2">
                      <div className={`w-8 h-8 rounded-full ${t.badge} flex items-center justify-center shrink-0 shadow-sm ring-4 ${t.ring}`}>
                        <span className="text-sm font-bold text-white">{phase.no}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium leading-none">ระยะที่ {phase.no}</p>
                        <p className="font-semibold text-gray-800 leading-tight mt-0.5">{phase.title}</p>
                      </div>
                    </div>

                    {/* Steps flow */}
                    <div className="flex flex-wrap items-center gap-2 pl-2">
                      {phase.steps.map((step, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
                            <span className="text-lg shrink-0">{step.emoji}</span>
                            <div className="leading-tight">
                              <p className="text-sm font-medium text-gray-800">{step.label}</p>
                              <p className="text-xs text-gray-400">{step.role}</p>
                            </div>
                          </div>
                          {si < phase.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connector between phases */}
                  {pi < PHASES.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0.5 h-4 bg-gray-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion */}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5" />
            ครบทั้ง 5 ระยะ = วิทยานิพนธ์ได้รับการอนุมัติสมบูรณ์ 🎉
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          ข้อมูลทดสอบ — บันทึกใน localStorage เท่านั้น
        </p>
      </div>
    </div>
  );
}
