"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSubmissionPage() {
  const router = useRouter();
  const { createSubmission } = useApp();
  const [title, setTitle] = useState("");
  const [advisorId, setAdvisorId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const advisors = MOCK_USERS.filter((u) => u.role === "ADVISOR");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("กรุณาระบุชื่อหัวข้อ"); return; }
    const sub = createSubmission(title.trim(), advisorId || undefined);
    router.push(`/dashboard/student/${sub.id}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">ยื่นคำร้องวิทยานิพนธ์</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ชื่อหัวข้อวิทยานิพนธ์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null); }}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="เช่น การพัฒนาระบบ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">อาจารย์ที่ปรึกษา</label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">— เลือกอาจารย์ที่ปรึกษา —</option>
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            สร้างคำร้อง
          </button>
        </form>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">ขั้นตอนหลังสร้างคำร้อง</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>อัปโหลดแบบ บ.วศ.1ก และกด "ส่งให้อาจารย์ที่ปรึกษา"</li>
          <li>รอการอนุมัติจากอาจารย์ที่ปรึกษา → ประธานหลักสูตร</li>
          <li>อัปโหลดเอกสารเพิ่มเติมตามขั้นตอน</li>
          <li>ติดตามสถานะในหน้าหลัก</li>
        </ol>
      </div>
    </div>
  );
}
