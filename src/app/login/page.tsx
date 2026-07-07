"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, GraduationCap, BookOpen, ArrowLeft } from "lucide-react";

type RoleChoice = "STUDENT" | "PROFESSOR" | null;

export default function LoginPage() {
  const { user } = useApp();
  const router = useRouter();
  const [role, setRole]             = useState<RoleChoice>(null);
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

  const isStudent = role === "STUDENT";
  const accent = isStudent
    ? { from: "from-blue-600", to: "to-indigo-600", ring: "focus:ring-blue-500", hover: "hover:from-blue-700 hover:to-indigo-700", shadow: "shadow-blue-200", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", icon: "from-blue-600 to-indigo-700" }
    : { from: "from-emerald-600", to: "to-teal-600", ring: "focus:ring-emerald-500", hover: "hover:from-emerald-700 hover:to-teal-700", shadow: "shadow-emerald-200", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", icon: "from-emerald-600 to-teal-700" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-7">

        {/* Brand */}
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${role ? `${accent.icon} shadow-lg ${accent.shadow}` : "from-blue-600 to-indigo-700 shadow-lg shadow-blue-200"} transition-all duration-300`}>
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
            <p className="text-gray-500 mt-1.5">คณะวิศวกรรมศาสตร์ · ยื่น ติดตาม และลงนามเอกสารออนไลน์</p>
          </div>
        </div>

        {/* Role picker */}
        {!role && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-5">
            <div>
              <h2 className="font-bold text-gray-800 text-xl">เข้าสู่ระบบ</h2>
              <p className="text-gray-500 text-sm mt-1">กรุณาเลือกประเภทผู้ใช้</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole("STUDENT")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">นิสิต</p>
                  <p className="text-xs text-gray-400 mt-0.5">Student</p>
                </div>
              </button>
              <button
                onClick={() => setRole("PROFESSOR")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">อาจารย์ / บุคลากร</p>
                  <p className="text-xs text-gray-400 mt-0.5">Professor / Staff</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Login form */}
        {role && (
          <div className={`bg-white rounded-2xl border ${accent.border} shadow-sm p-7 space-y-5`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setRole(null); setError(null); setEmail(""); setPassword(""); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold text-gray-800 text-xl">เข้าสู่ระบบ</h2>
                <p className={`text-xs font-medium mt-0.5 ${accent.text}`}>
                  {isStudent ? "นิสิต (Student)" : "อาจารย์ / บุคลากร (Professor / Staff)"}
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className={`w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${accent.ring}`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className={`w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${accent.ring} pr-12`}
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

              <button type="submit" disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r ${accent.from} ${accent.to} text-white font-semibold rounded-xl ${accent.hover} transition text-base shadow-sm disabled:opacity-60`}>
                <LogIn className="w-5 h-5" />
                {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            <div className="flex items-center justify-between text-sm">
              {isStudent
                ? <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">สร้างบัญชีใหม่</Link>
                : <span />
              }
              <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700">ลืมรหัสผ่าน?</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
