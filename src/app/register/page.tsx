"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, UserPlus, Mail, CheckCircle2, BookOpen, ArrowLeft } from "lucide-react";
import { isValidEmail, isValidStudentId } from "@/lib/utils";

type RoleChoice = "STUDENT" | "PROFESSOR" | null;

export default function RegisterPage() {
  const [role, setRole]             = useState<RoleChoice>(null);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [studentId, setStudentId]   = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())  { setError("กรุณากรอกชื่อ-นามสกุล"); return; }
    if (!email.trim()) { setError("กรุณากรอกอีเมล"); return; }
    if (!isValidEmail(email)) { setError("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"); return; }
    if (role === "STUDENT" && !studentId.trim()) { setError("กรุณากรอกรหัสนิสิต"); return; }
    if (role === "STUDENT" && !isValidStudentId(studentId)) { setError("รหัสนิสิตต้องเป็นตัวเลข 10 หลัก"); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), role, studentId: studentId.trim() || undefined }),
    });

    setSubmitting(false);

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEmailFailed(data.emailSent === false);
      setDone(true);
      return;
    }

    setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }

  const isStudent = role === "STUDENT";
  const accent = isStudent
    ? { border: "border-blue-200", ring: "focus:ring-blue-500", text: "text-blue-600", label: "นิสิต (Student)", btn: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" }
    : { border: "border-emerald-200", ring: "focus:ring-emerald-500", text: "text-emerald-600", label: "อาจารย์ / บุคลากร (Professor / Staff)", btn: "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" };

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

        {/* Role picker */}
        {!role && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 space-y-5">
            <div>
              <h2 className="font-bold text-gray-800 text-xl">สร้างบัญชีใหม่</h2>
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

        {/* Registration form */}
        {role && !done && (
          <div className={`bg-white rounded-2xl border ${accent.border} shadow-sm p-6 space-y-5`}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { setRole(null); setError(null); setName(""); setEmail(""); setStudentId(""); }}
                className="text-gray-400 hover:text-gray-600 transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold text-gray-800 text-xl">สร้างบัญชีใหม่</h2>
                <p className={`text-xs font-medium mt-0.5 ${accent.text}`}>{accent.label}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  className={`w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${accent.ring}`}
                  placeholder="เช่น นายสมชาย ใจดี"
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {isStudent && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5 text-sm">
                    รหัสนิสิต <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setError(null); }}
                    className={`w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${accent.ring}`}
                    placeholder="เช่น 6733100421"
                  />
                </div>
              )}
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
                    className={`w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 ${accent.ring}`}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <button type="submit" disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r ${accent.btn} text-white font-semibold rounded-xl transition text-base shadow-sm disabled:opacity-60`}>
                <UserPlus className="w-5 h-5" />
                {submitting ? "กำลังสร้างบัญชี..." : "ลงทะเบียน"}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center">ระบบจะส่งรหัสผ่านไปที่อีเมลของคุณโดยอัตโนมัติ</p>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ลงทะเบียนสำเร็จ!</h2>
              {emailFailed ? (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-3 text-sm leading-relaxed text-left">
                  สร้างบัญชีเรียบร้อยแล้ว แต่ระบบไม่สามารถส่งอีเมลรหัสผ่านไปที่<br />
                  <strong>{email}</strong> ได้<br />
                  กรุณาใช้ปุ่ม &ldquo;ลืมรหัสผ่าน&rdquo; ในหน้าเข้าสู่ระบบ หรือติดต่อเจ้าหน้าที่ภาควิชา
                </p>
              ) : (
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  ระบบส่งรหัสผ่านและลิงก์เข้าสู่ระบบไปที่<br />
                  <strong className="text-gray-800">{email}</strong><br />
                  แล้ว กรุณาตรวจสอบอีเมลของคุณ
                </p>
              )}
            </div>
            <Link href="/login" className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              ไปยังหน้าเข้าสู่ระบบ →
            </Link>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">เข้าสู่ระบบ</Link>
        </p>

      </div>
    </div>
  );
}
