"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_EMOJI, ROLE_GRADIENT } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, GraduationCap, Sparkles, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { Role } from "@/types";

const DEMO_USERS = [
  { email: "superadmin@eng.chula.ac.th", name: "ผู้ดูแลระบบสูงสุด",           role: "SUPER_ADMIN" as Role },
  { email: "admin@eng.chula.ac.th",      name: "พี่โบ้ (เจ้าหน้าที่ภาควิชา)", role: "ADMIN" as Role },
  { email: "student@eng.chula.ac.th",    name: "นายอานนท์ ใจดี",              role: "STUDENT" as Role },
  { email: "niphon.w@eng.chula.ac.th",   name: "รศ.ดร.นิพนธ์ วรรณโสภาคย์",   role: "PROGRAM_CHAIR" as Role },
  { email: "angkee.s@eng.chula.ac.th",   name: "รศ.ดร.อังคีร์ ศรีภคากร",      role: "ADVISOR" as Role },
  { email: "alongkorn.p@eng.chula.ac.th",name: "รศ.ดร.อลงกรณ์ พิมพ์พิณ",     role: "HEAD_EXAM_COMMITTEE" as Role },
  { email: "sunhapos.c@eng.chula.ac.th", name: "ผศ.ดร.สัณหพศ จันทรานุวัฒน์",  role: "EXAM_COMMITTEE" as Role },
  { email: "viboon.s@eng.chula.ac.th",   name: "ศ.ดร.วิบูลย์ แสงวีระพันธุ์ศิริ", role: "INVITED_EXAM_COMMITTEE" as Role },
];

// ─── Workflow as 5 phases (matches the official process diagram) ───────────────

interface Step { emoji: string; label: string; role: string; }
interface Phase { no: number; title: string; docs: string[]; steps: Step[]; }

const PHASES: Phase[] = [
  {
    no: 1, title: "เสนอหัวข้อโครงร่างวิทยานิพนธ์", docs: ["บ.วศ.1ก", "บ.วศ.1ข"],
    steps: [
      { emoji: "🎓", label: "ยื่นหัวข้อ", role: "นักศึกษา" },
      { emoji: "👨‍🏫", label: "ลงนาม", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "🏛️", label: "ลงนาม", role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 2, title: "แต่งตั้งคณะกรรมการสอบ", docs: ["บ.วศ.1ค", "บ.วศ.1ง"],
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร", role: "นักศึกษา" },
      { emoji: "⭐", label: "ลงนาม", role: "ประธานกรรมการสอบ" },
      { emoji: "👨‍🏫", label: "ลงนาม", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "📋", label: "ลงนามตามลำดับ", role: "กรรมการสอบ" },
      { emoji: "🏛️", label: "ลงนาม", role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 3, title: "ประเมินวิทยานิพนธ์ก่อนสอบ", docs: ["บ.2", "บ.3"],
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร", role: "นักศึกษา" },
      { emoji: "📋", label: "ลงนามแยกกัน", role: "กรรมการสอบ" },
      { emoji: "👨‍🏫", label: "ลงนาม บ.3", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "⭐", label: "ลงนาม บ.3", role: "ประธานกรรมการสอบ" },
      { emoji: "🏛️", label: "ลงนาม", role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 4, title: "คณะออกเอกสารสอบ", docs: ["ใบเชิญ", "แบบรายงาน"],
    steps: [
      { emoji: "🛡️", label: "รับเอกสารจากคณะ", role: "เจ้าหน้าที่" },
      { emoji: "🎓", label: "รับเอกสาร", role: "นักศึกษา" },
    ],
  },
  {
    no: 5, title: "ลงนามหลังสอบป้องกัน", docs: ["ใบรายงานผล", "แบบรายงานนำเสนอ"],
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร", role: "นักศึกษา" },
      { emoji: "⭐", label: "ลงนาม", role: "ประธานกรรมการสอบ" },
      { emoji: "👨‍🏫", label: "ลงนาม", role: "อาจารย์ที่ปรึกษา" },
      { emoji: "📋", label: "ลงนาม", role: "กรรมการสอบ" },
      { emoji: "🔏", label: "ลงนาม", role: "กรรมการภายนอก" },
      { emoji: "🏛️", label: "ลงนาม", role: "ประธานหลักสูตร" },
    ],
  },
];

// Static color classes per phase (Tailwind-safe)
const PHASE_THEME = [
  { grad: "from-blue-500 to-indigo-600",   text: "text-blue-600",   line: "bg-blue-200",   chip: "bg-blue-50 text-blue-700" },
  { grad: "from-teal-500 to-emerald-600",  text: "text-teal-600",   line: "bg-teal-200",   chip: "bg-teal-50 text-teal-700" },
  { grad: "from-amber-500 to-orange-600",  text: "text-amber-600",  line: "bg-amber-200",  chip: "bg-amber-50 text-amber-700" },
  { grad: "from-purple-500 to-fuchsia-600",text: "text-purple-600", line: "bg-purple-200", chip: "bg-purple-50 text-purple-700" },
  { grad: "from-rose-500 to-red-600",      text: "text-rose-600",   line: "bg-rose-200",   chip: "bg-rose-50 text-rose-700" },
];

export default function LoginPage() {
  const { user } = useApp();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role]);
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("กรุณาใส่อีเมลและรหัสผ่าน"); return; }
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false });
    setSubmitting(false);
    if (result?.error) { setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); return; }
    // redirect handled by useEffect above after session updates
  }

  async function quickLogin(email: string, role: Role) {
    setSubmitting(true);
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      window.location.href = ROLE_ROUTES[role];
    } else {
      setSubmitting(false);
    }
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
        <div className="grid gap-6 items-start lg:grid-cols-2">
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
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition text-base shadow-sm disabled:opacity-60"
              >
                <LogIn className="w-5 h-5" />
                {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>

          {/* Demo shortcuts — click to log in instantly by role */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold uppercase tracking-wide">ทดสอบระบบ — คลิกเข้าใช้ตามบทบาท</p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u.email, u.role)}
                  disabled={submitting}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-transparent hover:shadow-md transition text-left disabled:opacity-60"
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

        {/* WORKFLOW — premium 5-phase timeline */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10">
          <div className="text-center mb-9">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full mb-3">
              ขั้นตอนการทำงาน
            </span>
            <h2 className="font-bold text-gray-900 text-2xl sm:text-3xl">เส้นทางสู่การอนุมัติวิทยานิพนธ์</h2>
            <p className="text-gray-500 mt-2">5 ระยะ · 8 บทบาท · เอกสารส่งต่อให้ผู้รับผิดชอบถัดไปโดยอัตโนมัติ</p>
          </div>

          <ol className="relative max-w-2xl mx-auto">
            {PHASES.map((phase, pi) => {
              const t = PHASE_THEME[pi];
              return (
                <li key={phase.no} className="relative flex gap-4 sm:gap-6">
                  {/* Left rail: node + connector */}
                  <div className="flex flex-col items-center">
                    <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${t.grad} flex items-center justify-center shadow-lg text-white font-bold text-xl shrink-0`}>
                      {phase.no}
                    </div>
                    <div className={`w-1 flex-1 my-2 rounded-full ${t.line}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8 min-w-0">
                    {/* Eyebrow + doc badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wide ${t.text}`}>ระยะที่ {phase.no}</span>
                      {phase.docs.map((d) => (
                        <span key={d} className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.chip}`}>
                          {d}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-bold text-gray-800 text-lg leading-snug mb-3">{phase.title}</h3>

                    {/* Step pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {phase.steps.map((step, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <div className="flex items-center gap-2.5 bg-gray-50 hover:bg-white hover:shadow-sm border border-gray-200 rounded-xl pl-2 pr-3.5 py-2 transition">
                            <span className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-base shrink-0">
                              {step.emoji}
                            </span>
                            <div className="leading-tight">
                              <p className="text-sm font-semibold text-gray-800">{step.label}</p>
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
                </li>
              );
            })}

            {/* Finish milestone */}
            <li className="relative flex gap-4 sm:gap-6">
              <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 flex items-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl px-5 py-4 w-full">
                  <p className="font-bold text-green-800">สำเร็จการศึกษา 🎉</p>
                  <p className="text-sm text-green-600 mt-0.5">วิทยานิพนธ์ได้รับการอนุมัติครบทุกขั้นตอน</p>
                </div>
              </div>
            </li>
          </ol>
        </div>

        <p className="text-xs text-gray-400 text-center">
          ข้อมูลทดสอบ — บันทึกใน localStorage เท่านั้น
        </p>
      </div>
    </div>
  );
}
