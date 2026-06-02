"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { FileUploader } from "@/components/FileUploader";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { FormType } from "@/types";
import { ArrowLeft, Download, FileText, Send } from "lucide-react";
import Link from "next/link";

const STUDENT_FORMS: FormType[] = ["BW1A", "BW1B", "THESIS"];

export default function StudentSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, submissions, approveCurrentStep } = useApp();
  const router = useRouter();

  const sub = submissions.find((s) => s.id === id);
  if (!sub || sub.studentId !== user?.id) {
    return <p className="text-gray-500">ไม่พบข้อมูลคำร้อง</p>;
  }

  const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isStudentTurn = currentStep?.role === "STUDENT";
  const completedPercent = Math.round(
    (sub.workflowSteps.filter((s) => s.status === "APPROVED").length / sub.workflowSteps.length) * 100
  );

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          <p className="text-xs text-gray-400 mt-1">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">ความคืบหน้า</p>
          <p className="text-sm font-bold text-blue-600">{completedPercent}%</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completedPercent}%` }} />
        </div>
        {currentStep && sub.status === "IN_PROGRESS" && (
          <p className="text-xs text-gray-500 mt-2">
            {isStudentTurn ? "⏳ ถึงคิวของคุณ — กรุณาอัปโหลดเอกสาร" : `รอ: ${ROLE_LABELS[currentStep.role]} (ขั้นที่ ${currentStep.stepOrder})`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">ขั้นตอนทั้งหมด</h2>
          <WorkflowTimeline steps={sub.workflowSteps} />
        </div>

        {/* Files & Upload */}
        <div className="space-y-4">
          {/* Uploaded files */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-3">ไฟล์ที่อัปโหลด</h2>
              <ul className="space-y-2.5">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 leading-snug">{FORM_LABELS[u.formType]}</p>
                      <p className="text-xs text-gray-400">{u.fileName} · {formatBytes(u.fileSize)}</p>
                    </div>
                    <button onClick={() => alert(`[Demo] ดาวน์โหลด: ${u.fileName}`)} className="shrink-0 text-blue-400">
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload forms */}
          {isStudentTurn && sub.status === "IN_PROGRESS" && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-800 text-sm">อัปโหลดเอกสาร</h2>
              {STUDENT_FORMS.map((ft) => (
                <FileUploader key={ft} submissionId={sub.id} formType={ft} />
              ))}
              <button
                onClick={() => { approveCurrentStep(sub.id); router.refresh(); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                <Send className="w-4 h-4" />
                ส่งให้อาจารย์ที่ปรึกษาตรวจสอบ
              </button>
            </div>
          )}

          {sub.status === "COMPLETED" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 font-medium text-center">
              🎉 วิทยานิพนธ์ได้รับการอนุมัติเรียบร้อย
            </div>
          )}

          {sub.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 text-center">
              <p className="font-medium">คำร้องถูกปฏิเสธ</p>
              <p className="text-xs mt-1">กรุณาติดต่ออาจารย์ที่ปรึกษา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
