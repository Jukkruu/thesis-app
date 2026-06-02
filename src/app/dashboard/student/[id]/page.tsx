"use client";

import { useParams } from "next/navigation";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { FileUploader } from "@/components/FileUploader";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { FormType } from "@/types";
import { ArrowLeft, Download, FileText, Send, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

const STEP1_FORMS: FormType[] = ["BW1A", "BW1B"];

export default function StudentSubmissionDetail() {
  const { id }   = useParams<{ id: string }>();
  const { user, submissions, approveCurrentStep } = useApp();
  const { showToast } = useToast();
  const sub = submissions.find((s) => s.id === id);

  if (!sub || sub.studentId !== user?.id) {
    return (
      <div className="text-center py-20 text-gray-400 space-y-2">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
        <Link href="/dashboard/student" className="text-blue-500 hover:underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const advisor     = MOCK_USERS.find((u) => u.id === sub.advisorId);
  const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn    = currentStep?.role === "STUDENT";
  const hasUpload   = sub.uploads.some((u) => u.formType === "BW1A" || u.formType === "BW1B");
  const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps  = sub.workflowSteps.length;
  const subStatus   = sub.status;

  // What should the student see/do right now
  function renderActionCard() {
    if (!sub) return null;
    if (subStatus === "COMPLETED") {
      return (
        <div className="bg-green-50 border border-green-300 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-green-800 font-bold text-lg">วิทยานิพนธ์ผ่านการอนุมัติ</p>
            <p className="text-green-600 text-sm mt-1">ผ่านครบทุก {totalSteps} ขั้นตอนแล้ว</p>
          </div>
        </div>
      );
    }

    if (subStatus === "REJECTED") {
      const rejectedStep = sub.workflowSteps.find((s) => s.status === "REJECTED");
      return (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="text-red-800 font-bold text-lg">คำร้องถูกปฏิเสธ</p>
            {rejectedStep?.notes && (
              <p className="text-red-600 text-sm mt-1">
                เหตุผล: "{rejectedStep.notes}"
              </p>
            )}
            <p className="text-red-500 text-sm mt-2">
              โปรดติดต่อ{rejectedStep ? ROLE_LABELS[rejectedStep.role] : "ผู้รับผิดชอบ"}เพื่อขอคำแนะนำ
            </p>
          </div>
        </div>
      );
    }

    if (isMyTurn) {
      return (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-7 h-7 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-800 font-bold text-lg">ถึงคิวของท่านแล้ว</p>
            <p className="text-blue-600 text-sm mt-1">
              กรุณาอัปโหลดแบบ บ.วศ.1ก (ต้องการ) และ บ.วศ.1ข (ถ้ามี) แล้วกดส่ง
            </p>
          </div>
        </div>
      );
    }

    if (currentStep) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4">
          <Clock className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-800 font-bold text-lg">รอการดำเนินการ</p>
            <p className="text-orange-600 text-sm mt-1">
              ขณะนี้รอ <span className="font-semibold">{ROLE_LABELS[currentStep.role]}</span> ดำเนินการ (ขั้นที่ {currentStep.stepOrder})
            </p>
            <p className="text-orange-500 text-xs mt-1">ท่านไม่ต้องดำเนินการใดในขณะนี้</p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium">
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับรายการ
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          {advisor && (
            <p className="text-gray-500 text-sm">
              อาจารย์ที่ปรึกษา: <span className="font-medium text-gray-700">{advisor.name}</span>
            </p>
          )}
          <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      {/* Action card — tells student exactly what to do */}
      {renderActionCard()}

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 shrink-0">{doneCount}/{totalSteps} ขั้น</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">ขั้นตอนทั้งหมด</h2>
          <WorkflowTimeline steps={sub.workflowSteps} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Uploaded files */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-3">
                เอกสารที่อัปโหลดแล้ว ({sub.uploads.length})
              </h2>
              <ul className="space-y-2.5">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 leading-snug">{FORM_LABELS[u.formType]}</p>
                      <p className="text-xs text-gray-400">{u.fileName} · {formatBytes(u.fileSize)}</p>
                    </div>
                    <button
                      onClick={() => alert(`[Demo] ดาวน์โหลด: ${u.fileName}`)}
                      className="shrink-0 text-blue-400 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload + submit — only when it's student's turn */}
          {isMyTurn && sub.status === "IN_PROGRESS" && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-800 text-sm">อัปโหลดเอกสาร</h2>
              {STEP1_FORMS.map((ft) => (
                <FileUploader key={ft} submissionId={sub.id} formType={ft} />
              ))}

              <button
                onClick={() => { approveCurrentStep(sub.id); showToast("ส่งเอกสารให้อาจารย์ที่ปรึกษาแล้ว ✓"); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <Send className="w-5 h-5" />
                ส่งให้อาจารย์ที่ปรึกษาตรวจสอบ
              </button>

              {!hasUpload && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ แนะนำให้อัปโหลดอย่างน้อย 1 เอกสารก่อนส่ง
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
