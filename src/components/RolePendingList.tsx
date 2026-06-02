"use client";

import { useApp } from "@/context/AppContext";
import { Role } from "@/types";
import { MOCK_USERS } from "@/context/AppContext";
import { SubmissionStatusBadge } from "./StatusBadge";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

interface Props {
  role: Role;
  title: string;
  basePath: string;
}

export function RolePendingList({ role, title, basePath }: Props) {
  const { submissions } = useApp();

  const pending = submissions.filter((sub) => {
    const step = sub.workflowSteps.find((s) => s.status === "PENDING");
    return step?.role === role;
  });

  const getStudent = (studentId: string) =>
    MOCK_USERS.find((u) => u.id === studentId);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Clock className="w-3.5 h-3.5" />
          {pending.length} รายการรอดำเนินการ
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock className="w-12 h-12 mb-3 opacity-30" />
          <p>ไม่มีรายการที่รอดำเนินการ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => {
            const student = getStudent(sub.studentId);
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            return (
              <Link
                key={sub.id}
                href={`${basePath}/${sub.id}`}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SubmissionStatusBadge status={sub.status} />
                    {currentStep && (
                      <span className="text-xs text-gray-500">
                        ขั้นที่ {currentStep.stepOrder} · {ROLE_LABELS[currentStep.role]}
                      </span>
                    )}
                  </div>
                  {student && (
                    <p className="text-sm text-gray-500">
                      {student.name}
                      {student.studentId && ` (${student.studentId})`}
                    </p>
                  )}
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
