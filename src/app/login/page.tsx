"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, GraduationCap, ChevronDown } from "lucide-react";

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

  const busy = submitting;

  return (
    <div className="bg-gradient-to-b from-indigo-50 via-white to-gray-50">

      {/* ── LOGIN HERO — fills the viewport ───────────────────────────── */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-7">

          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
              <p className="text-gray-500 mt-1.5">คณะวิศวกรรมศาสตร์ · ยื่น ติดตาม และลงนามเอกสารออนไลน์</p>
            </div>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-5">
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

          {/* Scroll hint */}
          <div className="flex flex-col items-center gap-1 text-gray-400 text-xs">
            <span>ดูขั้นตอนการทำงาน</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* ── WORKFLOW — compact secondary section below the fold ───────── */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">
            เส้นทางสู่การอนุมัติวิทยานิพนธ์ · 5 ระยะ · 8 บทบาท
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PHASES.map((phase, pi) => {
              const t = PHASE_THEME[pi];
              return (
                <div key={phase.no} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.grad} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                      {phase.no}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {phase.type === "PROPOSAL" ? "PROPOSAL" : "THESIS"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 leading-snug">{phase.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.docs.map((d) => (
                      <span key={d} className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${t.chip}`}>{d}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {phase.steps.map((s, si) => (
                      <span key={si} title={`${s.label} · ${s.role}`} className="text-base leading-none">{s.emoji}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-300 pt-2">
            เอกสารส่งต่ออัตโนมัติ · ลงนามออนไลน์ · ติดตามสถานะแบบเรียลไทม์
          </p>
        </div>
      </div>

    </div>
  );
}
