"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_LABELS, getStepName, formatDate } from "@/lib/utils";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, FileText, Bell } from "lucide-react";
import type { MockSubmission, MockWorkflowStep } from "@/types";

function pendingLabel(
  sub: MockSubmission,
  step: MockWorkflowStep,
  users: { id: string; name: string; role: string }[],
): string {
  switch (step.role) {
    case "ADVISOR":             return users.find((u) => u.id === sub.advisorId)?.name ?? ROLE_LABELS[step.role];
    case "HEAD_EXAM_COMMITTEE": return users.find((u) => u.id === sub.headCommitteeId)?.name ?? ROLE_LABELS[step.role];
    case "EXAM_COMMITTEE": {
      const memberIds = step.committeeMembers?.length ? step.committeeMembers : (sub.committeeIds ?? []);
      const done = (step.committeeActions ?? []).filter((a) => a.decision === "APPROVED").length;
      return `${ROLE_LABELS[step.role]} (${done}/${memberIds.length})`;
    }
    default: return ROLE_LABELS[step.role];
  }
}

export default function AdminDashboard() {
  const { submissions, user, users } = useApp();

  const inProgress  = submissions.filter((s) => s.status === "IN_PROGRESS");
  const completed   = submissions.filter((s) => s.status === "COMPLETED");
  const needsMe     = inProgress.filter((s) => s.workflowSteps.find((w) => w.status === "PENDING")?.role === "ADMIN");
  const waitingOther = inProgress.filter((s) => s.workflowSteps.find((w) => w.status === "PENDING")?.role !== "ADMIN");

  return (
    <div className="max-w-3xl space-y-6">
      <DashboardHeader
        role="ADMIN"
        name={user?.name ?? "ผู้ดูแลระบบ"}
        title="ภาพรวมระบบ"
        highlight={{ label: "รอดำเนินการ", value: needsMe.length }}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<FileText className="w-5 h-5 text-gray-400" />}      label="ทั้งหมด"         value={submissions.length} color="bg-gray-50 border-gray-200" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-500" />}         label="กำลังดำเนินการ"  value={inProgress.length}  color="bg-blue-50 border-blue-200" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="เสร็จสิ้น"       value={completed.length}   color="bg-green-50 border-green-200" />
      </div>

      {/* Needs my action */}
      {needsMe.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-800">รอดำเนินการจากท่าน ({needsMe.length})</h2>
          </div>
          <div className="space-y-2">
            {needsMe.map((sub) => {
              const student = users.find((u) => u.id === sub.studentId);
              const step    = sub.workflowSteps.find((w) => w.status === "PENDING")!;
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center gap-3 bg-orange-50 border-2 border-orange-200 hover:border-orange-400 rounded-2xl px-4 py-3.5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                    <p className="text-sm text-gray-500">{student?.name} · {getStepName(step.stepOrder, sub.submissionType) || ROLE_LABELS[step.role]}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* All in-progress */}
      {waitingOther.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-gray-800">กำลังดำเนินการ ({waitingOther.length})</h2>
          <div className="space-y-2">
            {waitingOther.map((sub) => {
              const student     = users.find((u) => u.id === sub.studentId);
              const step        = sub.workflowSteps.find((w) => w.status === "PENDING");
              const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
              const totalSteps  = sub.workflowSteps.length;
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center gap-3 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl px-4 py-3.5 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-gray-900 truncate">{sub.title}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{student?.name}</span>
                      {step && (
                        <span className="text-blue-600 font-medium">
                          รอ: {pendingLabel(sub, step, users)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(doneCount / totalSteps) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{doneCount}/{totalSteps}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {inProgress.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>ไม่มีคำร้องที่กำลังดำเนินการ</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${color}`}>
      {icon}
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
