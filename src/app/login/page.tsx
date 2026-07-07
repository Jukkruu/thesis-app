"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, LogIn, GraduationCap, Sparkles, ArrowRight,
  CheckCircle2, ExternalLink, ChevronRight,
} from "lucide-react";
import { Role } from "@/types";

interface DemoUser {
  email: string;
  name: string;
  roleLabel: string;
  dashboard: string;
  color: string;
  emoji: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: "superadmin@eng.chula.ac.th", name: "ผู้ดูแลระบบสูงสุด",           roleLabel: "Super Admin",        dashboard: "/dashboard/super-admin",         color: "from-yellow-400 to-amber-500",   emoji: "👑" },
  { email: "admin@eng.chula.ac.th",      name: "พี่โบ้ (เจ้าหน้าที่ภาควิชา)", roleLabel: "เจ้าหน้าที่ภาควิชา",  dashboard: "/dashboard/admin",               color: "from-slate-600 to-gray-800",     emoji: "🛡️" },
  { email: "suphap.m@chula.ac.th",       name: "สุภาพ หมุดอุบล",              roleLabel: "เจ้าหน้าที่ภาควิชา",  dashboard: "/dashboard/admin",               color: "from-slate-600 to-gray-800",     emoji: "🛡️" },
  { email: "student@eng.chula.ac.th",    name: "นายอานนท์ ใจดี",              roleLabel: "นิสิต",              dashboard: "/dashboard/student",             color: "from-blue-500 to-indigo-600",    emoji: "🎓" },
  { email: "niphon.w@eng.chula.ac.th",   name: "รศ.ดร.นิพนธ์ วรรณโสภาคย์",   roleLabel: "ประธานหลักสูตร",     dashboard: "/dashboard/program-chair",       color: "from-violet-500 to-purple-600",  emoji: "🏛️" },
  { email: "angkee.s@eng.chula.ac.th",   name: "รศ.ดร.อังคีร์ ศรีภคากร",     roleLabel: "อาจารย์ที่ปรึกษา",   dashboard: "/dashboard/advisor",             color: "from-violet-500 to-purple-600",  emoji: "👨‍🏫" },
  { email: "alongkorn.p@eng.chula.ac.th",name: "รศ.ดร.อลงกรณ์ พิมพ์พิณ",     roleLabel: "ประธานกรรมการสอบ",   dashboard: "/dashboard/head-exam-committee", color: "from-rose-500 to-pink-600",      emoji: "⭐" },
  { email: "sunhapos.c@eng.chula.ac.th", name: "ผศ.ดร.สัณหพศ จันทรานุวัฒน์", roleLabel: "กรรมการสอบ",         dashboard: "/dashboard/exam-committee",      color: "from-teal-500 to-cyan-600",      emoji: "📋" },
  { email: "viboon.s@eng.chula.ac.th",   name: "ศ.ดร.วิบูลย์ แสงวีระพันธุ์ศิริ", roleLabel: "กรรมการภายนอก",  dashboard: "/dashboard/invited-exam-committee", color: "from-orange-500 to-amber-600", emoji: "🌐" },
];

// ─── Workflow phases ──────────────────────────────────────────────────────────
interface Step  { emoji: string; label: string; role: string }
interface Phase { no: number; title: string; docs: string[]; steps: Step[]; type: "PROPOSAL" | "THESIS" }

const PHASES: Phase[] = [
  {
    no: 1, title: "เสนอหัวข้อโครงร่างวิทยานิพนธ์", docs: ["บ.วศ.1ก", "บ.วศ.1ข"], type: "PROPOSAL",
    steps: [
      { emoji: "🎓", label: "ยื่นหัวข้อ",   role: "นักศึกษา" },
      { emoji: "🛡️", label: "ตรวจสอบ",      role: "เจ้าหน้าที่" },
      { emoji: "🏛️", label: "ลงนาม",        role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 2, title: "แต่งตั้งคณะกรรมการสอบ", docs: ["บ.วศ.1ค", "บ.วศ.1ง"], type: "PROPOSAL",
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร",  role: "นักศึกษา" },
      { emoji: "⭐", label: "ลงนาม",          role: "ประธานกรรมการสอบ" },
      { emoji: "👨‍🏫", label: "ลงนาม",         role: "อาจารย์ที่ปรึกษา" },
      { emoji: "📋", label: "ลงนามตามลำดับ",  role: "กรรมการสอบ" },
      { emoji: "🏛️", label: "ลงนาม",         role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 3, title: "ประเมินวิทยานิพนธ์ก่อนสอบ", docs: ["บ.2", "บ.3"], type: "THESIS",
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร",  role: "นักศึกษา" },
      { emoji: "📋", label: "ลงนามแยกกัน",    role: "กรรมการสอบ" },
      { emoji: "👨‍🏫", label: "ลงนาม บ.2",     role: "อาจารย์ที่ปรึกษา" },
      { emoji: "⭐", label: "ลงนาม บ.2",      role: "ประธานกรรมการสอบ" },
      { emoji: "🏛️", label: "ลงนาม",         role: "ประธานหลักสูตร" },
    ],
  },
  {
    no: 4, title: "คณะออกเอกสารสอบ", docs: ["ใบเชิญ", "แบบรายงาน"], type: "THESIS",
    steps: [
      { emoji: "🛡️", label: "รับเอกสารจากคณะ", role: "เจ้าหน้าที่" },
      { emoji: "🎓", label: "รับเอกสาร",        role: "นักศึกษา" },
    ],
  },
  {
    no: 5, title: "ลงนามหลังสอบป้องกัน", docs: ["ใบรายงานผล", "แบบรายงาน"], type: "THESIS",
    steps: [
      { emoji: "🎓", label: "อัปโหลดเอกสาร",         role: "นักศึกษา" },
      { emoji: "👨‍🏫", label: "ลงนาม",                 role: "อาจารย์ที่ปรึกษา" },
      { emoji: "⭐", label: "ลงนาม",                  role: "ประธานกรรมการสอบ" },
      { emoji: "📋", label: "ลงนาม",                  role: "กรรมการสอบ" },
      { emoji: "🏛️", label: "ลงนาม",                 role: "ประธานหลักสูตร" },
    ],
  },
];

const PHASE_THEME = [
  { grad: "from-blue-500 to-indigo-600",    text: "text-blue-600",   line: "bg-blue-200",   chip: "bg-blue-50 text-blue-700" },
  { grad: "from-teal-500 to-emerald-600",   text: "text-teal-600",   line: "bg-teal-200",   chip: "bg-teal-50 text-teal-700" },
  { grad: "from-amber-500 to-orange-600",   text: "text-amber-600",  line: "bg-amber-200",  chip: "bg-amber-50 text-amber-700" },
  { grad: "from-purple-500 to-fuchsia-600", text: "text-purple-600", line: "bg-purple-200", chip: "bg-purple-50 text-purple-700" },
  { grad: "from-rose-500 to-red-600",       text: "text-rose-600",   line: "bg-rose-200",   chip: "bg-rose-50 text-rose-700" },
];

export default function LoginPage() {
  const { user } = useApp();
  const router = useRouter();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

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
  }

  async function quickLogin(u: DemoUser) {
    setLoadingEmail(u.email);
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: u.email }),
    });
    if (res.ok) {
      window.location.href = u.dashboard;
    } else {
      setLoadingEmail(null);
    }
  }

  const busy = submitting || !!loadingEmail;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
            <p className="text-gray-500 mt-1.5 text-base">คณะวิศวกรรมศาสตร์ · ยื่น ติดตาม และลงนามเอกสารออนไลน์</p>
          </div>
        </div>

        {/* ── Login form ────────────────────────────────────────────────── */}
        <div className="mx-auto w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-5">
          <h2 className="font-bold text-gray-800 text-xl">เข้าสู่ระบบ</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5 text-sm">อีเมล</label>
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
              <label className="block font-medium text-gray-700 mb-1.5 text-sm">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition text-base shadow-sm disabled:opacity-60">
              <LogIn className="w-5 h-5" />
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">สร้างบัญชีใหม่</Link>
            <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700">ลืมรหัสผ่าน?</Link>
          </div>
        </div>

        {/* ── Demo shortcuts ────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800">ทดสอบระบบ</p>
                <p className="text-xs text-gray-500">คลิกที่บทบาทเพื่อเข้าสู่ระบบทันที — ไม่ต้องใส่รหัสผ่าน</p>
              </div>
            </div>
            <Link href="/demo"
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition">
              <ExternalLink className="w-3.5 h-3.5" />
              ดูทั้งหมด
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO_USERS.map((u) => {
              const isLoading = loadingEmail === u.email;
              return (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  disabled={busy}
                  className="group flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm transition text-left disabled:opacity-60 w-full"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                    {isLoading
                      ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      : u.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate leading-snug">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{u.roleLabel}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Workflow timeline ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10">
          <div className="text-center mb-9">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full mb-3">
              ขั้นตอนการทำงาน
            </span>
            <h2 className="font-bold text-gray-900 text-2xl sm:text-3xl">เส้นทางสู่การอนุมัติวิทยานิพนธ์</h2>
            <p className="text-gray-500 mt-2">5 ระยะ · 8 บทบาท · เอกสารส่งต่อให้ผู้รับผิดชอบถัดไปโดยอัตโนมัติ</p>
          </div>

          <ol className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap px-2">คำร้องโครงร่าง (PROPOSAL)</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {PHASES.map((phase, pi) => {
              const t = PHASE_THEME[pi];
              const prevType = pi > 0 ? PHASES[pi - 1].type : null;
              const showDivider = prevType !== null && prevType !== phase.type;
              return (
                <li key={phase.no} className="relative flex gap-4 sm:gap-6">
                  {showDivider && (
                    <div className="absolute -top-4 left-0 right-0 flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap px-2">คำร้องสอบวิทยานิพนธ์ (THESIS DEFENSE)</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className="flex flex-col items-center">
                    <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${t.grad} flex items-center justify-center shadow-lg text-white font-bold text-xl shrink-0`}>
                      {phase.no}
                    </div>
                    <div className={`w-1 flex-1 my-2 rounded-full ${t.line}`} />
                  </div>

                  <div className={`flex-1 min-w-0 ${showDivider ? "pt-4 pb-8" : "pb-8"}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wide ${t.text}`}>ระยะที่ {phase.no}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                        {phase.type === "PROPOSAL" ? "PROPOSAL" : "THESIS DEFENSE"}
                      </span>
                      {phase.docs.map((d) => (
                        <span key={d} className={`text-xs font-medium px-2 py-0.5 rounded-md ${t.chip}`}>{d}</span>
                      ))}
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg leading-snug mb-3">{phase.title}</h3>
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

      </div>
    </div>
  );
}
