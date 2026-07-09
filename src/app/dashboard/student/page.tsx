"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";
import { ChevronRight, PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, Layers, BookOpen, GraduationCap, XCircle } from "lucide-react";

export default function StudentDashboard() {
  const { user, submissions, users } = useApp();
  const mine = submissions.filter((s) => s.studentId === user?.id);

  const inProgress = mine.filter((s) => s.status === "IN_PROGRESS").length;
  const completed  = mine.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Gradient header */}
      <DashboardHeader
        role="STUDENT"
        name={user?.name ?? ""}
        title="วิทยานิพนธ์ของฉัน"
        highlight={{ label: "กำลังดำเนินการ", value: inProgress }}
      />

      {/* New submission — two separate form types */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">ยื่นคำร้องใหม่</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard/student/submit?type=proposal"
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition group"
          >
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-700 transition">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 text-sm leading-snug">ขอสอบโครงร่างวิทยานิพนธ์</p>
              <p className="text-xs text-blue-600 mt-0.5">สำหรับการสอบ Proposal (บ.วศ.1ก/ข/ค/ง)</p>
            </div>
          </Link>

          <Link
            href="/dashboard/student/submit?type=defense"
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100 transition group"
          >
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-700 transition">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 text-sm leading-snug">ขอสอบวิทยานิพนธ์</p>
              <p className="text-xs text-indigo-600 mt-0.5">สำหรับการสอบวิทยานิพนธ์ (บ.2/3/4)</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      {mine.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-gray-400">
              <Layers className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{mine.length}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">ทั้งหมด</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-blue-500">
              <Clock className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-bold text-blue-700">{inProgress}</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">กำลังดำเนินการ</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-2xl sm:text-3xl font-bold text-green-700">{completed}</span>
            </div>
            <p className="text-xs sm:text-sm text-green-600 mt-1">เสร็จสิ้น</p>
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/dashboard/student/submit?type=proposal"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition text-sm"
            >
              <BookOpen className="w-4 h-4" />
              ขอสอบโครงร่าง
            </Link>
            <Link
              href="/dashboard/student/submit?type=defense"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
            >
              <GraduationCap className="w-4 h-4" />
              ขอสอบวิทยานิพนธ์
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((sub) => {
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            const isMyTurn    = currentStep?.role === "STUDENT";
            const advisor     = users.find((u) => u.id === sub.advisorId);
            const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
            const totalSteps  = sub.workflowSteps.filter((s) => s.status !== "SKIPPED").length;

            const accent =
              sub.status === "COMPLETED"  ? "bg-green-400"
              : sub.status === "REJECTED"  ? "bg-red-400"
              : sub.status === "CANCELLED" ? "bg-gray-300"
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

                <div className="flex items-center gap-3 p-4 sm:p-5 flex-1 min-w-0">
                {/* Status icon */}
                <div className="shrink-0">
                  {sub.status === "COMPLETED"  && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                  {sub.status === "REJECTED"   && <AlertCircle  className="w-8 h-8 text-red-500" />}
                  {sub.status === "CANCELLED"  && <XCircle      className="w-8 h-8 text-gray-400" />}
                  {sub.status === "IN_PROGRESS" && isMyTurn && <AlertCircle className="w-8 h-8 text-blue-500" />}
                  {sub.status === "IN_PROGRESS" && !isMyTurn && <Clock className="w-8 h-8 text-orange-400" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {sub.submissionType === "PROPOSAL" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <BookOpen className="w-3 h-3" />โครงร่าง
                      </span>
                    )}
                    {sub.submissionType === "THESIS_DEFENSE" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        <GraduationCap className="w-3 h-3" />สอบวิทยานิพนธ์
                      </span>
                    )}
                    <p className="font-semibold text-gray-900 truncate text-lg leading-snug">{sub.title}</p>
                  </div>

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
                    {sub.status === "REJECTED" && (
                      <span className="text-sm text-red-600 font-semibold">★ กรุณาแก้ไขและยื่นใหม่</span>
                    )}
                    {!isMyTurn && sub.status === "IN_PROGRESS" && currentStep && (
                      <span className="text-sm text-gray-500">รอ: {ROLE_LABELS[currentStep.role]}</span>
                    )}
                  </div>

                  {/* Mini progress */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${accent}`}
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
