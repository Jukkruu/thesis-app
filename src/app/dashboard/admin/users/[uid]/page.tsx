"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, STEP_NAMES, formatDate } from "@/lib/utils";
import { MockSubmission, Role } from "@/types";
import {
  ArrowLeft, ChevronRight, FileText, Clock,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  if (days < 30) return `${days} วันที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

function getRelatedSubmissions(
  submissions: MockSubmission[],
  userId: string,
  role: Role
): MockSubmission[] {
  if (role === "STUDENT") return submissions.filter((s) => s.studentId === userId);
  if (role === "ADVISOR") return submissions.filter((s) => s.advisorId === userId);
  if (role === "ADMIN")   return submissions;
  return submissions.filter((s) =>
    s.workflowSteps.some((st) => st.role === role)
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserProfilePage() {
  const { uid }         = useParams<{ uid: string }>();
  const { submissions } = useApp();

  const user = MOCK_USERS.find((u) => u.id === uid);
  if (!user) {
    return (
      <div className="text-center py-20 text-gray-400 space-y-2">
        <p className="text-lg">ไม่พบผู้ใช้งาน</p>
        <Link href="/dashboard/admin/users" className="text-blue-500 hover:underline">
          กลับรายชื่อผู้ใช้
        </Link>
      </div>
    );
  }

  const related   = getRelatedSubmissions(submissions, uid, user.role);
  const inProg    = related.filter((s) => s.status === "IN_PROGRESS").length;
  const completed = related.filter((s) => s.status === "COMPLETED").length;
  const rejected  = related.filter((s) => s.status === "REJECTED").length;

  // Sort: in-progress first, then by date desc
  const sorted = [...related].sort((a, b) => {
    const order = { IN_PROGRESS: 0, DRAFT: 1, REJECTED: 2, COMPLETED: 3 };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    return diff !== 0 ? diff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับรายชื่อผู้ใช้
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start gap-4">
          {/* Avatar initial */}
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-blue-600">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{user.name}</h1>
            <p className="text-gray-500 mt-0.5">{user.email}</p>
            {user.studentId && (
              <p className="text-sm text-gray-400 mt-0.5">รหัสนักศึกษา: {user.studentId}</p>
            )}
          </div>
          <span className="shrink-0 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            {ROLE_LABELS[user.role]}
          </span>
        </div>

        {/* Quick stats */}
        {related.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <StatBox icon={<Clock className="w-5 h-5 text-blue-500" />}        value={inProg}    label="กำลังดำเนินการ" color="text-blue-700" />
            <StatBox icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} value={completed} label="เสร็จสิ้น"       color="text-green-700" />
            <StatBox icon={<XCircle className="w-5 h-5 text-red-400" />}        value={rejected}  label="ถูกปฏิเสธ"      color="text-red-600" />
          </div>
        )}
      </div>

      {/* Submissions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          คำร้องที่เกี่ยวข้อง
          <span className="text-sm font-normal text-gray-400">({related.length} รายการ)</span>
        </h2>

        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-14 text-center text-gray-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto opacity-25" />
            <p>ยังไม่มีคำร้องที่เกี่ยวข้อง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((sub) => {
              const student     = MOCK_USERS.find((u) => u.id === sub.studentId);
              const advisor     = MOCK_USERS.find((u) => u.id === sub.advisorId);
              const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
              const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
              const totalSteps  = sub.workflowSteps.length;

              // For non-student roles: show which step they are at for this submission
              const myStep = user.role !== "STUDENT" && user.role !== "ADMIN"
                ? sub.workflowSteps.find((s) => s.role === user.role && s.status === "PENDING")
                  ?? sub.workflowSteps.filter((s) => s.role === user.role).at(-1)
                : null;

              // Days since last activity
              const lastAction = sub.workflowSteps
                .filter((s) => s.actedAt)
                .sort((a, b) => new Date(b.actedAt!).getTime() - new Date(a.actedAt!).getTime())[0];

              const isStuck = sub.status === "IN_PROGRESS" && lastAction?.actedAt
                && Math.floor((Date.now() - new Date(lastAction.actedAt).getTime()) / (1000 * 60 * 60 * 24)) > 7;

              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  {/* Title + action button */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <p className="font-semibold text-gray-900 text-lg leading-snug min-w-0">{sub.title}</p>
                    <Link
                      href={`/dashboard/admin/${sub.id}`}
                      className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                    >
                      ดู / แก้ไข
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Meta */}
                  <div className="text-sm text-gray-500 space-y-0.5">
                    {user.role !== "STUDENT" && student && (
                      <p>
                        นักศึกษา:{" "}
                        <Link href={`/dashboard/admin/users/${student.id}`} className="font-medium text-blue-600 hover:underline">
                          {student.name}
                        </Link>
                      </p>
                    )}
                    {user.role !== "ADVISOR" && advisor && (
                      <p>ที่ปรึกษา: <span className="text-gray-700">{advisor.name}</span></p>
                    )}
                  </div>

                  {/* Status row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmissionStatusBadge status={sub.status} />

                    {/* Current step waiting on */}
                    {currentStep && sub.status === "IN_PROGRESS" && (
                      <span className="text-sm text-orange-600 font-medium">
                        ⏳ รอ: {STEP_NAMES[currentStep.stepOrder]}
                      </span>
                    )}

                    {/* This user's step status */}
                    {myStep && (
                      <span className={`text-sm font-medium ${
                        myStep.status === "APPROVED" ? "text-green-600"
                        : myStep.status === "REJECTED" ? "text-red-500"
                        : "text-blue-600"
                      }`}>
                        {myStep.status === "APPROVED" ? "✓ ท่านอนุมัติแล้ว"
                        : myStep.status === "REJECTED" ? "✗ ท่านปฏิเสธแล้ว"
                        : "● ถึงคิวของท่าน"}
                      </span>
                    )}

                    {/* Stuck warning */}
                    {isStuck && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        ค้างนาน
                      </span>
                    )}
                  </div>

                  {/* Progress + dates */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{doneCount}/{totalSteps} ขั้น</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>ยื่นเมื่อ {daysSince(sub.createdAt)}</span>
                    {lastAction?.actedAt && (
                      <span>อัปเดตล่าสุด {daysSince(lastAction.actedAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {icon}
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
