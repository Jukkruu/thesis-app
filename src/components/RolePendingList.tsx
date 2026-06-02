"use client";

import { useState } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { Role } from "@/types";
import { SubmissionStatusBadge } from "./StatusBadge";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, History } from "lucide-react";

interface Props {
  role: Role;
  title: string;
  basePath: string;
}

export function RolePendingList({ role, title, basePath }: Props) {
  const { submissions } = useApp();
  const [tab, setTab] = useState<"pending" | "history">("pending");

  const pending = submissions.filter((sub) => {
    const step = sub.workflowSteps.find((s) => s.status === "PENDING");
    return step?.role === role;
  });

  const history = submissions.filter((sub) => {
    const alreadyActed = sub.workflowSteps.some(
      (s) => s.role === role && (s.status === "APPROVED" || s.status === "REJECTED")
    );
    const isCurrentlyPending = pending.some((p) => p.id === sub.id);
    return alreadyActed && !isCurrentlyPending;
  });

  const getStudent = (id: string) => MOCK_USERS.find((u) => u.id === id);
  const list = tab === "pending" ? pending : history;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium text-sm ${
          pending.length > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
        }`}>
          {pending.length > 0
            ? <><Clock className="w-4 h-4" />{pending.length} รายการรอดำเนินการ</>
            : <><CheckCircle2 className="w-4 h-4" />ไม่มีรายการค้าง</>
          }
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("pending")}
          className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition ${
            tab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          รอดำเนินการ
          {pending.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition ${
            tab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <History className="w-4 h-4" />
          ประวัติที่ดำเนินการแล้ว
          {history.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 text-gray-400 space-y-2">
          {tab === "pending"
            ? <><CheckCircle2 className="w-12 h-12 opacity-25" /><p className="text-lg">ไม่มีรายการที่รอดำเนินการ</p></>
            : <><History className="w-12 h-12 opacity-25" /><p className="text-lg">ยังไม่มีประวัติการดำเนินการ</p></>
          }
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((sub) => {
            const student     = getStudent(sub.studentId);
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            const mySteps     = sub.workflowSteps.filter((s) => s.role === role && s.status !== "PENDING");
            const lastMyStep  = mySteps.at(-1);

            return (
              <Link
                key={sub.id}
                href={`${basePath}/${sub.id}`}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="space-y-2 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 leading-snug truncate">{sub.title}</p>

                  {student && (
                    <p className="text-gray-600">
                      {student.name}
                      {student.studentId && <span className="text-gray-400"> ({student.studentId})</span>}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <SubmissionStatusBadge status={sub.status} />
                    {tab === "pending" && currentStep && (
                      <span className="text-sm text-orange-600 font-medium">
                        ⏳ ขั้นที่ {currentStep.stepOrder} · รอท่านดำเนินการ
                      </span>
                    )}
                    {tab === "history" && lastMyStep && (
                      <span className={`text-sm font-medium ${lastMyStep.status === "APPROVED" ? "text-green-600" : "text-red-500"}`}>
                        {lastMyStep.status === "APPROVED" ? "✓ ท่านอนุมัติแล้ว" : "✗ ท่านปฏิเสธแล้ว"}
                        {lastMyStep.actedAt && <span className="text-gray-400 font-normal"> · {formatDate(lastMyStep.actedAt)}</span>}
                      </span>
                    )}
                  </div>
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
