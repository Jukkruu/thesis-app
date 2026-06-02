"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { Role } from "@/types";
import { SubmissionStatusBadge } from "./StatusBadge";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2 } from "lucide-react";

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
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <span
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium ${
            pending.length > 0
              ? "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {pending.length > 0 ? (
            <Clock className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {pending.length > 0 ? `${pending.length} รายการรอดำเนินการ` : "ไม่มีรายการค้าง"}
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 text-gray-400 space-y-2">
          <CheckCircle2 className="w-12 h-12 opacity-30" />
          <p className="text-lg">ไม่มีรายการที่รอดำเนินการ</p>
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
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="space-y-2 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 leading-snug truncate">
                    {sub.title}
                  </p>
                  {student && (
                    <p className="text-gray-600">
                      นักศึกษา: {student.name}
                      {student.studentId && (
                        <span className="text-gray-400"> ({student.studentId})</span>
                      )}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <SubmissionStatusBadge status={sub.status} />
                    {currentStep && (
                      <span className="text-sm text-gray-500">
                        ขั้นที่ {currentStep.stepOrder} · {ROLE_LABELS[currentStep.role]}
                      </span>
                    )}
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
  );
}
