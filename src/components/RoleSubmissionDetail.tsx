"use client";

import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { SignatureButton } from "./SignatureButton";
import { SubmissionStatusBadge } from "./StatusBadge";
import { FORM_LABELS, ROLE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { Download, FileText, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  submissionId: string;
  backPath: string;
}

export function RoleSubmissionDetail({ submissionId, backPath }: Props) {
  const { user, submissions } = useApp();
  const sub = submissions.find((s) => s.id === submissionId);

  if (!sub) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
      </div>
    );
  }

  const student = MOCK_USERS.find((u) => u.id === sub.studentId);
  const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn = currentStep?.role === user?.role;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href={backPath}
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับ
      </Link>

      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          {student && (
            <p className="text-gray-600">
              นักศึกษา: {student.name}
              {student.studentId && (
                <span className="text-gray-400"> ({student.studentId})</span>
              )}
            </p>
          )}
          <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Workflow timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">ขั้นตอนการดำเนินการ</h2>
          <WorkflowTimeline steps={sub.workflowSteps} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Attached documents */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">เอกสารแนบ</h2>
              <ul className="space-y-3">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-700 leading-snug">
                        {FORM_LABELS[u.formType]}
                      </p>
                      <p className="text-sm text-gray-400">
                        {u.fileName} · {formatBytes(u.fileSize)}
                      </p>
                    </div>
                    <button
                      onClick={() => alert(`[Demo] ดาวน์โหลด: ${u.fileName}`)}
                      className="shrink-0 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action panel */}
          {isMyTurn && sub.status === "IN_PROGRESS" && (
            <SignatureButton submissionId={sub.id} />
          )}

          {!isMyTurn && currentStep && sub.status === "IN_PROGRESS" && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
                <Clock className="w-5 h-5" />
                รอดำเนินการ
              </div>
              <p className="text-orange-600">
                {ROLE_LABELS[currentStep.role]} (ขั้นที่ {currentStep.stepOrder})
              </p>
            </div>
          )}

          {sub.status === "COMPLETED" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <p className="text-green-700 font-semibold text-lg">✓ อนุมัติเรียบร้อย</p>
              <p className="text-green-600 text-sm mt-1">วิทยานิพนธ์ผ่านทุกขั้นตอนแล้ว</p>
            </div>
          )}

          {sub.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <p className="text-red-700 font-semibold text-lg">✗ ถูกปฏิเสธ</p>
              <p className="text-red-600 text-sm mt-1">ดูหมายเหตุในขั้นตอนที่ปฏิเสธ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
