"use client";

import { useState, useEffect } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role]);
  }, [user, router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const found = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());
    if (!found) {
      setError("ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง");
      return;
    }
    if (!password.trim()) {
      setError("กรุณาใส่รหัสผ่าน");
      return;
    }
    login(found.id);
    router.push(ROLE_ROUTES[found.role]);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการวิทยานิพนธ์</h1>
          <p className="text-gray-500">คณะวิศวกรรมศาสตร์</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="อีเมลของท่าน"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-base"
            >
              <LogIn className="w-5 h-5" />
              เข้าสู่ระบบ
            </button>
          </form>
        </div>

        {/* Demo shortcuts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            ทดสอบระบบ — เลือกบทบาท
          </p>
          <div className="space-y-1.5">
            {MOCK_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => { login(u.id); router.push(ROLE_ROUTES[u.role]); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition text-left"
              >
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-sm text-gray-400">{ROLE_LABELS[u.role]}</p>
                </div>
                <span className="text-sm text-blue-500 font-medium shrink-0 ml-2">เข้าใช้ →</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
