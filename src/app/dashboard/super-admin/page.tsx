"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS, ROLE_GRADIENT, ROLE_EMOJI, ROLE_DESC } from "@/lib/utils";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Role, MockUser } from "@/types";
import {
  Crown, Users, FileText, CheckCircle2, Clock, XCircle,
  Trash2, Plus, X, ShieldCheck, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const ALL_ROLES: Role[] = [
  "SUPER_ADMIN", "ADMIN", "STUDENT", "ADVISOR", "PROGRAM_CHAIR",
  "HEAD_EXAM_COMMITTEE", "EXAM_COMMITTEE", "INVITED_EXAM_COMMITTEE",
  "DEPT_STAFF", "FACULTY_DEAN", "GRADUATE_SCHOOL",
];

export default function SuperAdminPage() {
  const {
    user, users, submissions,
    superAdminUpdateUserRole, superAdminDeleteUser, superAdminAddUser,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newEmail,      setNewEmail]      = useState("");
  const [newRole,       setNewRole]       = useState<Role>("STUDENT");
  const [newStudentId,  setNewStudentId]  = useState("");

  const counts = {
    users:       users.length,
    total:       submissions.length,
    inProgress:  submissions.filter((s) => s.status === "IN_PROGRESS").length,
    completed:   submissions.filter((s) => s.status === "COMPLETED").length,
    rejected:    submissions.filter((s) => s.status === "REJECTED").length,
  };

  function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const userData: Omit<MockUser, "id"> = {
      name:  newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role:  newRole,
      ...(newRole === "STUDENT" && newStudentId.trim() ? { studentId: newStudentId.trim() } : {}),
    };
    superAdminAddUser(userData);
    setNewName(""); setNewEmail(""); setNewRole("STUDENT"); setNewStudentId("");
    setShowAddForm(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <DashboardHeader
        role="SUPER_ADMIN"
        name={user?.name ?? "ผู้ดูแลระบบสูงสุด"}
        title="ควบคุมระบบทั้งหมด"
        highlight={{ label: "ผู้ใช้งาน", value: counts.users }}
      />

      {/* System stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-6 h-6 text-amber-500" />}        label="ผู้ใช้ทั้งหมด"    value={counts.users}      color="bg-amber-50 border-amber-200" />
        <StatCard icon={<Clock className="w-6 h-6 text-blue-500" />}         label="กำลังดำเนินการ"   value={counts.inProgress} color="bg-blue-50 border-blue-200" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6 text-green-500" />} label="เสร็จสิ้น"        value={counts.completed}  color="bg-green-50 border-green-200" />
        <StatCard icon={<XCircle className="w-6 h-6 text-red-400" />}        label="ถูกปฏิเสธ"        value={counts.rejected}   color="bg-red-50 border-red-200" />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-gray-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">จัดการคำร้อง</p>
            <p className="text-sm text-gray-500">ดูและแก้ไขคำร้องทั้งหมด {counts.total} รายการ</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">รายชื่อผู้ใช้งาน</p>
            <p className="text-sm text-gray-500">ดูสถิติและคำร้องของแต่ละคน</p>
          </div>
        </Link>
      </div>

      {/* User management */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-800 text-lg">จัดการผู้ใช้งาน</h2>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "ยกเลิก" : "เพิ่มผู้ใช้"}
          </button>
        </div>

        {/* Add user form */}
        {showAddForm && (
          <form onSubmit={handleAddUser} className="p-5 border-b border-amber-100 bg-amber-50 space-y-4">
            <p className="font-medium text-amber-800">เพิ่มผู้ใช้งานใหม่</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_EMOJI[r]} {ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              {newRole === "STUDENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักศึกษา</label>
                  <input
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="เช่น 64010099"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              เพิ่มผู้ใช้งาน
            </button>
          </form>
        )}

        {/* User table */}
        <div className="divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLE_GRADIENT[u.role]} flex items-center justify-center shrink-0 text-base`}>
                {ROLE_EMOJI[u.role]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                  {u.studentId && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      รหัส {u.studentId}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">{u.email}</p>
              </div>

              {/* Role selector */}
              <select
                value={u.role}
                onChange={(e) => superAdminUpdateUserRole(u.id, e.target.value as Role)}
                disabled={u.id === user?.id}
                className="shrink-0 border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={u.id === user?.id ? "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : "เปลี่ยนบทบาท"}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>

              {/* Delete */}
              {u.id === user?.id ? (
                <div className="w-8 shrink-0" />
              ) : confirmDelete === u.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { superAdminDeleteUser(u.id); setConfirmDelete(null); }}
                    className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                  >ลบ</button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg"
                  >ยกเลิก</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(u.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                  title="ลบผู้ใช้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role reference */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">อ้างอิงบทบาทในระบบ</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {ALL_ROLES.map((r) => (
            <div key={r} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ROLE_GRADIENT[r]} flex items-center justify-center text-sm shrink-0`}>
                {ROLE_EMOJI[r]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{ROLE_LABELS[r]}</p>
                <p className="text-xs text-gray-400 truncate">{ROLE_DESC[r]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          การลบผู้ใช้หรือเปลี่ยนบทบาทจะมีผลทันที — หากผู้ใช้อยู่ระหว่างดำเนินการในขั้นตอน workflow อาจทำให้เกิดข้อผิดพลาดได้
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${color}`}>
      {icon}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
