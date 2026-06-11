"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ROLE_LABELS, STEP_NAMES, formatDate } from "@/lib/utils";
import { SubmissionStatus } from "@/types";
import Link from "next/link";
import {
  ChevronRight, Clock, CheckCircle2, XCircle, FileText,
  Trash2, Search, AlertCircle, Bell,
} from "lucide-react";

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_TABS: { label: string; value: SubmissionStatus | "ALL" }[] = [
  { label: "ทั้งหมด",            value: "ALL" },
  { label: "กำลังดำเนินการ",    value: "IN_PROGRESS" },
  { label: "เสร็จสิ้น",         value: "COMPLETED" },
  { label: "ถูกปฏิเสธ",         value: "REJECTED" },
];

export default function AdminDashboard() {
  const { submissions, adminDeleteSubmission, user, users } = useApp();

  // Submissions waiting for Admin's own approval (workflow step role === ADMIN)
  const myPending = submissions.filter((s) => {
    const step = s.workflowSteps.find((w) => w.status === "PENDING");
    return step?.role === "ADMIN";
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusFilter,  setStatusFilter]  = useState<SubmissionStatus | "ALL">("ALL");
  const [search,        setSearch]        = useState("");

  const filtered = submissions.filter((sub) => {
    const matchStatus = statusFilter === "ALL" || sub.status === statusFilter;
    const student     = users.find((u) => u.id === sub.studentId);
    const query       = search.toLowerCase();
    const matchSearch = !query
      || sub.title.toLowerCase().includes(query)
      || (student?.name ?? "").toLowerCase().includes(query)
      || (student?.studentId ?? "").toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = {
    ALL:         submissions.length,
    IN_PROGRESS: submissions.filter((s) => s.status === "IN_PROGRESS").length,
    COMPLETED:   submissions.filter((s) => s.status === "COMPLETED").length,
    REJECTED:    submissions.filter((s) => s.status === "REJECTED").length,
  };

  // Stage distribution: how many in-progress submissions sit at each step right now
  const stageData = Object.entries(STEP_NAMES).map(([order, name]) => {
    const stepOrder = Number(order);
    const count = submissions.filter((s) => {
      if (s.status !== "IN_PROGRESS") return false;
      const cur = s.workflowSteps.find((w) => w.status === "PENDING");
      return cur?.stepOrder === stepOrder;
    }).length;
    return { stepOrder, name, count };
  });
  const maxStage = Math.max(1, ...stageData.map((d) => d.count));

  const getStudent = (id: string) => users.find((u) => u.id === id);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Gradient header */}
      <DashboardHeader
        role="ADMIN"
        name={user?.name ?? "ผู้ดูแลระบบ"}
        title="ภาพรวมคำร้อง"
        highlight={{ label: "กำลังดำเนินการ", value: counts.IN_PROGRESS }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={<FileText className="w-6 h-6 text-gray-500" />}        label="ทั้งหมด"          value={counts.ALL}         color="bg-gray-50 border-gray-200" />
        <SummaryCard icon={<Clock className="w-6 h-6 text-blue-500" />}           label="กำลังดำเนินการ"  value={counts.IN_PROGRESS} color="bg-blue-50 border-blue-200" />
        <SummaryCard icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}   label="เสร็จสิ้น"       value={counts.COMPLETED}   color="bg-green-50 border-green-200" />
        <SummaryCard icon={<XCircle className="w-6 h-6 text-red-400" />}          label="ถูกปฏิเสธ"       value={counts.REJECTED}    color="bg-red-50 border-red-200" />
      </div>

      {/* My pending approvals */}
      {myPending.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-orange-800 text-lg">
              รออนุมัติจากท่าน ({myPending.length} รายการ)
            </h2>
          </div>
          <div className="space-y-2">
            {myPending.map((sub) => {
              const student = users.find((u) => u.id === sub.studentId);
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-orange-200 hover:border-orange-400 hover:shadow-sm transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                    <p className="text-sm text-gray-500">
                      {student?.name}
                      {student?.studentId && <span className="text-gray-400"> ({student.studentId})</span>}
                      <span className="ml-2 text-orange-600 font-medium">· รอการตรวจรับเอกสาร</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">อนุมัติ</span>
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage distribution chart */}
      {counts.IN_PROGRESS > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">การกระจายตามขั้นตอน</h2>
            <p className="text-sm text-gray-500 mt-0.5">คำร้องที่กำลังดำเนินการ — ค้างอยู่ที่ขั้นใดบ้าง (ช่วยหาคอขวด)</p>
          </div>
          <div className="space-y-2.5">
            {stageData.map((d) => (
              <div key={d.stepOrder} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-sm text-gray-600 text-right truncate">{d.name}</span>
                <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${d.count > 0 ? "bg-blue-500" : "bg-transparent"}`}
                    style={{ width: d.count > 0 ? `${Math.max((d.count / maxStage) * 100, 8)}%` : "0%" }}
                  />
                </div>
                <span className={`w-8 shrink-0 text-sm font-bold text-center ${d.count > 0 ? "text-blue-600" : "text-gray-300"}`}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อวิทยานิพนธ์ หรือชื่อนักศึกษา..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                statusFilter === tab.value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submission list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center space-y-2 text-gray-400">
          <Search className="w-10 h-10 mx-auto opacity-25" />
          <p className="text-lg">ไม่พบรายการที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const student     = getStudent(sub.studentId);
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
            const totalSteps  = sub.workflowSteps.length;
            const lastAction  = sub.workflowSteps
              .filter((s) => s.actedAt)
              .sort((a, b) => new Date(b.actedAt!).getTime() - new Date(a.actedAt!).getTime())[0];
            const stuckDays   = sub.status === "IN_PROGRESS" && lastAction?.actedAt
              ? daysSince(lastAction.actedAt) : 0;

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"
              >
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <p className="text-lg font-semibold text-gray-900 leading-snug min-w-0">{sub.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDelete === sub.id ? (
                      <>
                        <span className="text-sm text-red-600 font-medium">ยืนยันลบ?</span>
                        <button
                          onClick={() => { adminDeleteSubmission(sub.id); setConfirmDelete(null); }}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >ลบ</button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg"
                        >ยกเลิก</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDelete(sub.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/dashboard/admin/${sub.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                        >
                          จัดการ
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Student info — clickable to profile */}
                {student && (
                  <p className="text-gray-600">
                    นักศึกษา:{" "}
                    <Link
                      href={`/dashboard/admin/users/${student.id}`}
                      className="font-medium text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {student.name}
                    </Link>
                    {student.studentId && <span className="text-gray-400"> ({student.studentId})</span>}
                  </p>
                )}

                {/* Status + waiting */}
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusBadge status={sub.status} />
                  {currentStep ? (
                    <span className="text-sm text-orange-600 font-medium">
                      ⏳ รอ: {ROLE_LABELS[currentStep.role]} (ขั้นที่ {currentStep.stepOrder}/{totalSteps})
                    </span>
                  ) : sub.status === "COMPLETED" ? (
                    <span className="text-sm text-green-600 font-medium">✓ ผ่านครบทุกขั้นตอน</span>
                  ) : null}
                  {stuckDays > 7 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ค้างมา {stuckDays} วัน
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.status === "COMPLETED" ? "bg-green-500" :
                        sub.status === "REJECTED"  ? "bg-red-400"   : "bg-blue-500"
                      }`}
                      style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium shrink-0">{doneCount}/{totalSteps} ขั้น</span>
                </div>

                <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${color}`}>
      {icon}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
