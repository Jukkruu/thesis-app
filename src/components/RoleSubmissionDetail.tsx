"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { SignatureButton } from "./SignatureButton";
import { SubmissionStatusBadge } from "./StatusBadge";
import { FORM_LABELS, ROLE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { Download, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  submissionId: string;
  backPath: string;
}

export function RoleSubmissionDetail({ submissionId, backPath }: Props) {
  const { user, submissions } = useApp();
  const sub = submissions.find((s) => s.id === submissionId);

  if (!sub) return <p className="text-gray-500">ไม่พบข้อมูลคำร้อง</p>;

  const student = MOCK_USERS.find((u) => u.id === sub.studentId);
  const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn = currentStep?.role === user?.role;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={backPath} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          {student && (
            <p className="text-sm text-gray-500 mt-1">
              นักศึกษา: {student.name}
              {student.studentId && ` (${student.studentId})`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">ความคืบหน้า</h2>
          <WorkflowTimeline steps={sub.workflowSteps} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Files */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm">เอกสารแนบ</h2>
              <ul className="space-y-2.5">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 leading-snug">{FORM_LABELS[u.formType]}</p>
                      <p className="text-xs text-gray-400">{u.fileName} · {formatBytes(u.fileSize)}</p>
                    </div>
                    <button
                      onClick={() => alert(`[Demo] ดาวน์โหลด: ${u.fileName}`)}
                      className="shrink-0 text-blue-500 hover:text-blue-700 transition"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action */}
          {isMyTurn && sub.status === "IN_PROGRESS" && (
            <SignatureButton submissionId={sub.id} />
          )}

          {!isMyTurn && currentStep && sub.status === "IN_PROGRESS" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <span className="font-medium">รอดำเนินการจาก:</span>{" "}
              {ROLE_LABELS[currentStep.role]} (ขั้นที่ {currentStep.stepOrder})
            </div>
          )}

          {sub.status === "COMPLETED" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 font-medium text-center">
              ✓ วิทยานิพนธ์ได้รับการอนุมัติเรียบร้อย
            </div>
          )}

          {sub.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 font-medium text-center">
              ✗ คำร้องถูกปฏิเสธ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
