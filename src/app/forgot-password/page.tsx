"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, KeyRound, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("กรุณากรอกอีเมล"); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-gray-50 to-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
            <p className="text-gray-500 mt-1 text-sm">คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
          </div>
        </div>

        {done ? (
          /* Success state */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ส่งอีเมลแล้ว!</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                หากอีเมล <strong className="text-gray-800">{email}</strong> มีในระบบ<br />
                คุณจะได้รับรหัสผ่านใหม่ในอีเมลนั้น<br />
                กรุณาตรวจสอบอีเมลของคุณ
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ไปยังหน้าเข้าสู่ระบบ →
            </Link>
          </div>
        ) : (
          /* Form */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800 text-lg">ลืมรหัสผ่าน</h2>
            </div>
            <p className="text-sm text-gray-500">
              กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งรหัสผ่านใหม่ไปให้
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition text-base shadow-sm disabled:opacity-60"
              >
                <KeyRound className="w-5 h-5" />
                {submitting ? "กำลังส่งอีเมล..." : "ส่งรหัสผ่านใหม่"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            ← กลับไปยังหน้าเข้าสู่ระบบ
          </Link>
        </p>

      </div>
    </div>
  );
}
