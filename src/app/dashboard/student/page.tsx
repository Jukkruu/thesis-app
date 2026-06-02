"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { ChevronRight, PlusCircle, FileText } from "lucide-react";

export default function StudentDashboard() {
  const { user, submissions } = useApp();
  const mine = submissions.filter((s) => s.studentId === user?.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">วิทยานิพนธ์ของฉัน</h1>
        <Link
          href="/dashboard/student/submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <PlusCircle className="w-4 h-4" />
          ยื่นคำร้องใหม่
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p>ยังไม่มีคำร้อง</p>
          <Link href="/dashboard/student/submit" className="text-blue-500 text-sm mt-2 hover:underline">
            เริ่มยื่นคำร้องแรก
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((sub) => {
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            return (
              <Link
                key={sub.id}
                href={`/dashboard/student/${sub.id}`}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SubmissionStatusBadge status={sub.status} />
                    {currentStep && (
                      <span className="text-xs text-gray-500">
                        รอ: {ROLE_LABELS[currentStep.role]} (ขั้นที่ {currentStep.stepOrder})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(sub.createdAt)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 ml-4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
