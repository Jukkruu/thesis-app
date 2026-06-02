import Link from "next/link";
import { GraduationCap, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-gray-50 to-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200 mb-6">
        <GraduationCap className="w-9 h-9 text-white" />
      </div>
      <p className="text-6xl font-bold text-gray-900">404</p>
      <h1 className="text-xl font-semibold text-gray-700 mt-2">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-gray-500 mt-1.5 max-w-sm">
        หน้าที่ท่านเรียกอาจถูกย้ายหรือไม่มีอยู่ในระบบ
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        <Home className="w-5 h-5" />
        กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}
