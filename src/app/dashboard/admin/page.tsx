"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Users, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const { submissions } = useApp();

  const inProgress = submissions.filter((s) => s.status === "IN_PROGRESS").length;
  const completed  = submissions.filter((s) => s.status === "COMPLETED").length;
  const rejected   = submissions.filter((s) => s.status === "REJECTED").length;
  const total      = submissions.length;

  const getStudent = (id: string) => MOCK_USERS.find((u) => u.id === id);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แผงควบคุมผู้ดูแลระบบ</h1>
        <p className="text-gray-500 mt-1">ภาพรวมคำร้องวิทยานิพนธ์ทั้งหมดในระบบ</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<FileText className="w-6 h-6 text-gray-500" />} label="คำร้องทั้งหมด" value={total} color="bg-gray-50 border-gray-200" />
        <SummaryCard icon={<Clock className="w-6 h-6 text-blue-500" />} label="กำลังดำเนินการ" value={inProgress} color="bg-blue-50 border-blue-200" />
        <SummaryCard icon={<CheckCircle2 className="w-6 h-6 text-green-500" />} label="เสร็จสิ้น" value={completed} color="bg-green-50 border-green-200" />
        <SummaryCard icon={<XCircle className="w-6 h-6 text-red-500" />} label="ถูกปฏิเสธ" value={rejected} color="bg-red-50 border-red-200" />
      </div>

      {/* All submissions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">คำร้องทั้งหมด</h2>

        {submissions.length === 0 ? (
          <p className="text-gray-400 py-10 text-center">ยังไม่มีคำร้องในระบบ</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const student     = getStudent(sub.studentId);
              const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
              const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
              const totalSteps  = sub.workflowSteps.length;

              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="space-y-2 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">{sub.title}</p>

                    {student && (
                      <p className="text-gray-600">
                        นักศึกษา: {student.name}
                        {student.studentId && <span className="text-gray-400"> ({student.studentId})</span>}
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <SubmissionStatusBadge status={sub.status} />
                      {currentStep ? (
                        <span className="text-sm text-orange-600 font-medium">
                          ⏳ รอ: {ROLE_LABELS[currentStep.role]} (ขั้นที่ {currentStep.stepOrder}/{totalSteps})
                        </span>
                      ) : sub.status === "COMPLETED" ? (
                        <span className="text-sm text-green-600 font-medium">✓ ผ่านครบทุกขั้นตอน</span>
                      ) : null}
                    </div>

                    {/* Mini progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{doneCount}/{totalSteps} ขั้น</span>
                    </div>

                    <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-300 shrink-0 ml-4" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Users section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          ผู้ใช้งานในระบบ
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {MOCK_USERS.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center justify-between px-5 py-4 ${i !== MOCK_USERS.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div>
                <p className="font-medium text-gray-800">{u.name}</p>
                <p className="text-sm text-gray-400">{u.email}</p>
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${color}`}>
      {icon}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
