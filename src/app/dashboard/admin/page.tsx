"use client";

import { useApp } from "@/context/AppContext";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { MOCK_USERS } from "@/context/AppContext";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, XCircle, FileText, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { submissions, adminDeleteSubmission } = useApp();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const inProgress = submissions.filter((s) => s.status === "IN_PROGRESS").length;
  const completed  = submissions.filter((s) => s.status === "COMPLETED").length;
  const rejected   = submissions.filter((s) => s.status === "REJECTED").length;

  const getStudent = (id: string) => MOCK_USERS.find((u) => u.id === id);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แผงควบคุมผู้ดูแลระบบ</h1>
        <p className="text-gray-500 mt-1">ภาพรวมและจัดการคำร้องวิทยานิพนธ์ทั้งหมด</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card icon={<FileText className="w-6 h-6 text-gray-500" />} label="ทั้งหมด"           value={submissions.length} color="bg-gray-50 border-gray-200" />
        <Card icon={<Clock className="w-6 h-6 text-blue-500" />}    label="กำลังดำเนินการ"   value={inProgress}         color="bg-blue-50 border-blue-200" />
        <Card icon={<CheckCircle2 className="w-6 h-6 text-green-500" />} label="เสร็จสิ้น"  value={completed}          color="bg-green-50 border-green-200" />
        <Card icon={<XCircle className="w-6 h-6 text-red-500" />}   label="ถูกปฏิเสธ"       value={rejected}           color="bg-red-50 border-red-200" />
      </div>

      {/* Submission list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">คำร้องทั้งหมด</h2>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
            ยังไม่มีคำร้องในระบบ
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const student     = getStudent(sub.studentId);
              const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
              const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
              const totalSteps  = sub.workflowSteps.length;

              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  {/* Top row: title + actions */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold text-gray-900 leading-snug">{sub.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Delete */}
                      {confirmDelete === sub.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600 font-medium">ยืนยันลบ?</span>
                          <button
                            onClick={() => { adminDeleteSubmission(sub.id); setConfirmDelete(null); }}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg"
                          >
                            ลบ
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(sub.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="ลบคำร้อง"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/admin/${sub.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                      >
                        แก้ไข / ดูรายละเอียด
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Student + status */}
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

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 shrink-0">{doneCount}/{totalSteps} ขั้น</span>
                  </div>

                  <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${color}`}>
      {icon}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
