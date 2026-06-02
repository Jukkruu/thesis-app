"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";
import { ChevronRight, PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, Layers } from "lucide-react";

export default function StudentDashboard() {
  const { user, submissions } = useApp();
  const mine = submissions.filter((s) => s.studentId === user?.id);

  const inProgress = mine.filter((s) => s.status === "IN_PROGRESS").length;
  const completed  = mine.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Gradient header */}
      <DashboardHeader
        role="STUDENT"
        name={user?.name ?? ""}
        subtitle="ติดตามและจัดการวิทยานิพนธ์ของท่าน"
        highlight={{ label: "กำลังดำเนินการ", value: inProgress }}
      />

      {/* New submission button */}
      <Link
        href="/dashboard/student/submit"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
      >
        <PlusCircle className="w-5 h-5" />
        ยื่นคำร้องวิทยานิพนธ์ใหม่
      </Link>

      {/* Quick stats */}
      {mine.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-gray-400">
              <Layers className="w-5 h-5" />
              <span className="text-3xl font-bold text-gray-900">{mine.length}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ทั้งหมด</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center justify-between text-blue-500">
              <Clock className="w-5 h-5" />
              <span className="text-3xl font-bold text-blue-700">{inProgress}</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">กำลังดำเนินการ</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-center justify-between text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-3xl font-bold text-green-700">{completed}</span>
            </div>
            <p className="text-sm text-green-600 mt-1">เสร็จสิ้น</p>
          </div>
        </div>
      )}

      {/* List */}
      {mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 space-y-4">
          <FileText className="w-14 h-14 text-gray-200" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600">ยังไม่มีคำร้องวิทยานิพนธ์</p>
            <p className="text-gray-400 text-sm mt-1">เริ่มต้นโดยการยื่นคำร้องแรกของท่าน</p>
          </div>
          <Link
            href="/dashboard/student/submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            ยื่นคำร้องใหม่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((sub) => {
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            const isMyTurn    = currentStep?.role === "STUDENT";
            const advisor     = MOCK_USERS.find((u) => u.id === sub.advisorId);
            const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
            const totalSteps  = sub.workflowSteps.length;

            const accent =
              sub.status === "COMPLETED" ? "bg-green-400"
              : sub.status === "REJECTED" ? "bg-red-400"
              : isMyTurn ? "bg-blue-400"
              : "bg-orange-400";

            return (
              <Link
                key={sub.id}
                href={`/dashboard/student/${sub.id}`}
                className="group flex items-stretch bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition overflow-hidden"
              >
                {/* Accent bar */}
                <div className={`w-1.5 shrink-0 ${accent}`} />

                <div className="flex items-center gap-4 p-5 flex-1 min-w-0">
                {/* Status icon */}
                <div className="shrink-0">
                  {sub.status === "COMPLETED"  && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                  {sub.status === "REJECTED"   && <AlertCircle  className="w-8 h-8 text-red-500" />}
                  {sub.status === "IN_PROGRESS" && isMyTurn && <AlertCircle className="w-8 h-8 text-blue-500" />}
                  {sub.status === "IN_PROGRESS" && !isMyTurn && <Clock className="w-8 h-8 text-orange-400" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="font-semibold text-gray-900 truncate text-lg leading-snug">{sub.title}</p>

                  {advisor && (
                    <p className="text-sm text-gray-500">
                      ที่ปรึกษา: {advisor.name}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <SubmissionStatusBadge status={sub.status} />
                    {isMyTurn && sub.status === "IN_PROGRESS" && (
                      <span className="text-sm text-blue-600 font-semibold">★ ถึงคิวของท่าน</span>
                    )}
                    {!isMyTurn && currentStep && (
                      <span className="text-sm text-gray-500">รอ: {ROLE_LABELS[currentStep.role]}</span>
                    )}
                  </div>

                  {/* Mini progress */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{doneCount}/{totalSteps}</span>
                  </div>

                  <p className="text-xs text-gray-400">{formatDate(sub.createdAt)}</p>
                </div>

                <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
