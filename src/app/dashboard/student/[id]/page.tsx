"use client";

import { useParams } from "next/navigation";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { FileUploader } from "@/components/FileUploader";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, formatBytes, formatDate, downloadMockFile } from "@/lib/utils";
import { FormType } from "@/types";
import Link from "next/link";
import {
  ArrowLeft, Download, FileText, Send,
  AlertCircle, Clock, CheckCircle2, RefreshCw, StickyNote, CalendarDays, Car,
} from "lucide-react";
import { PROGRAM_LABELS } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

// Which forms are relevant to upload at which step
const SUGGESTED_BY_STEP: Record<number, { forms: FormType[]; label: string }> = {
  1: { forms: ["BW1A", "BW1B"],   label: "เอกสารเสนอหัวข้อ" },
  5: { forms: ["B3"],             label: "แบบประเมินก่อนสอบ" },
  6: { forms: ["B3"],             label: "แบบประเมินก่อนสอบ (ลงนาม)" },
  7: { forms: ["B4"],             label: "แบบลงนามอนุมัติ" },
  8: { forms: ["THESIS"],         label: "วิทยานิพนธ์ฉบับสมบูรณ์" },
};
const ALL_STUDENT_FORMS: FormType[] = ["BW1A", "BW1B", "B3", "B4", "THESIS"];

export default function StudentSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, submissions, users, approveCurrentStep, studentResubmit } = useApp();
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

  const allUsers     = users.length ? users : MOCK_USERS;
  const advisor      = allUsers.find((u) => u.id === sub.advisorId);
  const currentStep  = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn     = currentStep?.role === "STUDENT";
  const doneCount    = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps   = sub.workflowSteps.length;
  const subStatus    = sub.status;
  const uploadedTypes = new Set(sub.uploads.map((u) => u.formType));

  // Suggested forms for this step
  const suggested = currentStep ? (SUGGESTED_BY_STEP[currentStep.stepOrder] ?? null) : null;
  // Remaining forms student hasn't uploaded yet
  const remaining = ALL_STUDENT_FORMS.filter((f) => !uploadedTypes.has(f));

  function handleResubmit() {
    studentResubmit(sub!.id);
    showToast("ยื่นคำร้องใหม่แล้ว — กรุณาแนบเอกสารที่แก้ไข", "info");
  }

  function renderStatusBanner() {
    if (!sub) return null;

    if (subStatus === "COMPLETED") {
      return (
        <div className="bg-green-50 border border-green-300 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-green-800 font-bold text-lg">วิทยานิพนธ์ผ่านการอนุมัติครบทุกขั้นตอน</p>
            <p className="text-green-600 text-sm mt-1">ขอแสดงความยินดี!</p>
          </div>
        </div>
      );
    }

    if (subStatus === "REJECTED") {
      const rejectedStep = sub.workflowSteps.find((s) => s.status === "REJECTED");
      return (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-800 font-bold text-lg">คำร้องถูกปฏิเสธ</p>
              <p className="text-red-600 text-sm mt-0.5">
                จาก: {rejectedStep ? ROLE_LABELS[rejectedStep.role] : "ผู้รับผิดชอบ"}
              </p>
              {rejectedStep?.notes && (
                <p className="text-red-700 text-sm mt-2 bg-red-100 rounded-xl px-3 py-2">
                  เหตุผล: "{rejectedStep.notes}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleResubmit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
          >
            <RefreshCw className="w-5 h-5" />
            แก้ไขและยื่นใหม่อีกครั้ง
          </button>
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
              {suggested
                ? `กรุณาอัปโหลด${suggested.label} แล้วกดส่ง`
                : "กรุณาอัปโหลดเอกสารที่จำเป็น แล้วกดส่ง"}
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
              ขณะนี้รอ <span className="font-semibold">{ROLE_LABELS[currentStep.role]}</span> (ขั้นที่ {currentStep.stepOrder})
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

      {/* Status banner */}
      {renderStatusBanner()}

      {/* Admin note */}
      {sub.adminNote && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <StickyNote className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">บันทึกจากผู้ดูแลระบบ</p>
            <p className="text-yellow-800 text-sm">{sub.adminNote}</p>
          </div>
        </div>
      )}

      {/* Exam / committee info */}
      {(sub.examDate || sub.program || sub.headCommitteeId) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm">ข้อมูลการสอบ</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {sub.program && (
              <InfoRow label="หลักสูตร" value={PROGRAM_LABELS[sub.program] ?? sub.program} />
            )}
            {sub.examDate && (
              <InfoRow label="วันที่สอบ" value={`${sub.examDate}${sub.examTime ? ` เวลา ${sub.examTime} น.` : ""}`} icon={<CalendarDays className="w-4 h-4 text-blue-400" />} />
            )}
            {sub.roomNeeded && <InfoRow label="ห้องประชุม" value="ต้องการ" />}
            {sub.parkingNeeded && sub.carPlate && (
              <InfoRow label="ที่จอดรถ" value={sub.carPlate} icon={<Car className="w-4 h-4 text-gray-400" />} />
            )}
            {sub.headCommitteeId && (
              <InfoRow label="ประธานกรรมการสอบ" value={MOCK_USERS.find((u) => u.id === sub.headCommitteeId)?.name ?? sub.headCommitteeId} />
            )}
            {sub.invitedCommitteeId && (
              <InfoRow label="กรรมการภายนอก" value={sub.invitedCommitteeId} />
            )}
          </div>
        </div>
      )}

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
        {/* Timeline — second on mobile so upload/action is reachable first */}
        <div className="order-2 md:order-none md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">ขั้นตอนทั้งหมด</h2>
          <WorkflowTimeline steps={sub.workflowSteps} users={allUsers} />
        </div>

        {/* Right: files + upload — first on mobile */}
        <div className="order-1 md:order-none space-y-4">
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
                      onClick={() => downloadMockFile(u.fileName, FORM_LABELS[u.formType], sub.title)}
                      className="shrink-0 text-blue-400 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload section — always visible when in progress */}
          {subStatus === "IN_PROGRESS" && (
            <div className="bg-white rounded-2xl border border-blue-100 p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">อัปโหลดเอกสาร</h2>
                {suggested && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    แนะนำตอนนี้: {suggested.label}
                  </p>
                )}
              </div>

              {/* Suggested forms for current step */}
              {suggested?.forms
                .filter((f) => !uploadedTypes.has(f))
                .map((ft) => (
                  <FileUploader key={ft} submissionId={sub.id} formType={ft} />
                ))
              }

              {/* Other forms not yet uploaded */}
              {remaining
                .filter((f) => !suggested?.forms.includes(f))
                .length > 0 && (
                  <details className="group">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                      + เอกสารอื่น ๆ ที่ยังไม่ได้อัปโหลด
                    </summary>
                    <div className="mt-2 space-y-2">
                      {remaining
                        .filter((f) => !suggested?.forms.includes(f))
                        .map((ft) => (
                          <FileUploader key={ft} submissionId={sub.id} formType={ft} />
                        ))
                      }
                    </div>
                  </details>
                )
              }

              {/* Submit button — only at step 1 */}
              {isMyTurn && (
                <button
                  onClick={() => {
                    approveCurrentStep(sub.id);
                    showToast("ส่งเอกสารให้อาจารย์ที่ปรึกษาแล้ว ✓");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  <Send className="w-5 h-5" />
                  ส่งให้อาจารย์ที่ปรึกษาตรวจสอบ
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon ?? <span className="w-4 h-4 shrink-0" />}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
