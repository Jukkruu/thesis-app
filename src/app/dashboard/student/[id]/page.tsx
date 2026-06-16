"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { FileUploader } from "@/components/FileUploader";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, FORM_LABELS, formatDate } from "@/lib/utils";
import { PROGRAM_LABELS } from "@/lib/utils";
import { FormType } from "@/types";
import Link from "next/link";
import {
  ArrowLeft, Send, Upload,
  AlertCircle, Clock, CheckCircle2, RefreshCw, StickyNote, CalendarDays, Car, XCircle,
} from "lucide-react";
import { FileList } from "@/components/FileList";
import { useToast } from "@/context/ToastContext";

type StepSuggestion = { forms: FormType[]; label: string; multiUpload?: boolean };

// Per-type step suggestions — keyed by submissionType → stepOrder
const SUGGESTED_BY_STEP: Record<string, Record<number, StepSuggestion>> = {
  PROPOSAL: {
    1: { forms: ["BW1A", "BW1B"], label: "บ.วศ.1ก (ที่อาจารย์ที่ปรึกษาลงนามแล้ว) + บ.วศ.1ข" },
    4: { forms: ["B1C", "B1D"],   label: "บ.วศ.1ค + บ.วศ.1ง (กรอกข้อมูลครบถ้วน)" },
  },
  THESIS_DEFENSE: {
    1:  { forms: ["B2", "B3"],     label: "บ.2 (ลายเซ็นนิสิต) + บ.3 (กรอกข้อมูลครบถ้วน)" },
    7:  { forms: ["SIGNED"],       label: "invitation letter + แบบรายงานการเสนอผลงานฯ (ลายเซ็นนิสิต)", multiUpload: true },
    13: { forms: ["B4", "THESIS"], label: "บ.4 (กรอกครบถ้วน) + วิทยานิพนธ์ฉบับสมบูรณ์ (จาก e-thesis พร้อม barcode)" },
  },
};

// Per-type submit button labels
const SUBMIT_LABEL: Record<string, Record<number, string>> = {
  PROPOSAL: {
    1: "ส่งเอกสาร บ.วศ.1ก + บ.วศ.1ข",
    4: "ส่งเอกสาร บ.วศ.1ค + บ.วศ.1ง",
  },
  THESIS_DEFENSE: {
    1:  "ส่งเอกสาร บ.2 + บ.3",
    7:  "ส่งเอกสารหลังสอบ",
    13: "ส่ง บ.4 + วิทยานิพนธ์",
  },
};

// Non-SIGNED forms allowed for early upload per submission type
const ALL_STUDENT_FORMS: Record<string, FormType[]> = {
  PROPOSAL:       ["BW1A", "BW1B", "B1C", "B1D"],
  THESIS_DEFENSE: ["B2", "B3", "B4", "THESIS"],
};

export default function StudentSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, submissions, users, approveCurrentStep, studentResubmit, cancelSubmission } = useApp();
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

  const allUsers     = users;
  const advisor      = allUsers.find((u) => u.id === sub.advisorId);
  const currentStep  = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn     = currentStep?.role === "STUDENT";
  const doneCount    = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps   = sub.workflowSteps.length;
  const subStatus    = sub.status;
  const uploadedTypes = new Set(sub.uploads.map((u) => u.formType));

  const subType = sub.submissionType ?? "PROPOSAL";
  // Suggested forms for this step (per submission type + step order)
  const suggested = currentStep
    ? (SUGGESTED_BY_STEP[subType]?.[currentStep.stepOrder] ?? null)
    : null;
  // Remaining non-SIGNED forms the student hasn't uploaded yet
  const remaining = (ALL_STUDENT_FORMS[subType] ?? []).filter((f) => !uploadedTypes.has(f));

  // Required forms for current step — student cannot advance until all are uploaded
  const requiredForms = suggested?.forms ?? [];
  const allRequiredUploaded = requiredForms.length === 0 || requiredForms.every((f) => uploadedTypes.has(f));

  function handleResubmit() {
    studentResubmit(sub!.id);
    showToast("ยื่นคำร้องใหม่แล้ว — กรุณาแนบเอกสารที่แก้ไข", "info");
  }

  function handleCancel() {
    if (!confirm("ต้องการยกเลิกคำร้องนี้ใช่หรือไม่?\nหลังจากยกเลิกแล้วจะไม่สามารถดำเนินการต่อได้")) return;
    cancelSubmission(sub!.id);
    showToast("ยกเลิกคำร้องแล้ว", "info");
  }

  function renderStatusBanner() {
    if (!sub) return null;

    if (subStatus === "CANCELLED") {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
          <XCircle className="w-7 h-7 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 font-bold text-lg">ยกเลิกคำร้องแล้ว</p>
            <p className="text-gray-500 text-sm mt-1">คำร้องนี้ถูกยกเลิก — ท่านสามารถยื่นคำร้องใหม่ได้จากหน้าหลัก</p>
          </div>
        </div>
      );
    }

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
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-4">
            <Clock className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-800 font-bold text-lg">รอการดำเนินการ</p>
              <p className="text-orange-600 text-sm mt-1">
                ขณะนี้รอ <span className="font-semibold">{ROLE_LABELS[currentStep.role]}</span> (ขั้นที่ {currentStep.stepOrder})
              </p>
              <p className="text-orange-500 text-xs mt-1">ท่านไม่ต้องดำเนินการใดในขณะนี้</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิกคำร้องนี้
          </button>
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
              <InfoRow label="ประธานกรรมการสอบ" value={allUsers.find((u) => u.id === sub.headCommitteeId)?.name ?? sub.headCommitteeId} />
            )}
            {(sub.invitedProfName || sub.invitedCommitteeId) && (
              <InfoRow
                label="กรรมการภายนอก"
                value={sub.invitedProfName ?? allUsers.find((u) => u.id === sub.invitedCommitteeId)?.name ?? sub.invitedCommitteeId ?? ""}
              />
            )}
            {sub.invitedProfAffiliation && (
              <InfoRow label="สังกัดกรรมการภายนอก" value={sub.invitedProfAffiliation} />
            )}
            {sub.invitedProfEmail && (
              <InfoRow label="อีเมลกรรมการภายนอก" value={sub.invitedProfEmail} />
            )}
            {sub.invitedProfPhone && (
              <InfoRow label="เบอร์โทรกรรมการภายนอก" value={sub.invitedProfPhone} />
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
          <WorkflowTimeline steps={sub.workflowSteps} users={allUsers} submissionType={sub.submissionType} />
        </div>

        {/* Right: files + upload — first on mobile */}
        <div className="order-1 md:order-none space-y-4">
          {/* Uploaded files — show only latest per type, no history */}
          {sub.uploads.length > 0 && (
            <FileList
              uploads={sub.uploads}
              submissionTitle={sub.title}
              title={`เอกสารแนบ (${new Set(sub.uploads.map((u) => u.formType)).size} ไฟล์)`}
              compact
              hideHistory
            />
          )}

          {/* Upload section — always visible when in progress */}
          {subStatus === "IN_PROGRESS" && (
            <div className="bg-white rounded-2xl border border-blue-100 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">อัปโหลดเอกสาร</h2>
                  <p className="text-xs text-gray-400">เลือกไฟล์ PDF แล้วกดปุ่มอัปโหลด</p>
                </div>
              </div>

              {/* Required docs checklist — only when it's the student's turn and there are required forms */}
              {isMyTurn && suggested && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    เอกสารที่ต้องอัปโหลดก่อนส่ง
                    {suggested.multiUpload && <span className="font-normal">(อัปโหลดได้หลายไฟล์)</span>}
                  </p>
                  {suggested.forms.map((ft) => {
                    const done = uploadedTypes.has(ft);
                    return (
                      <div key={ft} className="flex items-center gap-2">
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          : <XCircle className="w-4 h-4 text-orange-400 shrink-0" />}
                        <span className={`text-xs flex-1 ${done ? "text-green-700" : "text-gray-800 font-medium"}`}>
                          {FORM_LABELS[ft]}
                        </span>
                        <span className={`text-xs font-semibold shrink-0 ${done ? "text-green-500" : "text-orange-500"}`}>
                          {done ? "✓ อัปโหลดแล้ว" : "รอ"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Uploaders for required forms — always show when it's the student's turn
                  so they can re-upload after a rejection without being blocked */}
              {suggested?.forms
                .filter((f) => suggested.multiUpload || isMyTurn || !uploadedTypes.has(f))
                .map((ft, idx) => (
                  <div key={`${ft}-${idx}`} className="space-y-1">
                    {isMyTurn && uploadedTypes.has(ft) && !suggested.multiUpload && (
                      <p className="text-xs text-gray-400">อัปโหลดใหม่เพื่อแทนที่ไฟล์เดิม (ถ้าต้องการแก้ไข)</p>
                    )}
                    <FileUploader submissionId={sub.id} formType={ft} />
                  </div>
                ))}

              {/* Optional remaining forms (not required for this step) */}
              {remaining.filter((f) => !suggested?.forms.includes(f)).map((ft) => (
                <FileUploader key={ft} submissionId={sub.id} formType={ft} />
              ))}

              {/* Submit button */}
              {isMyTurn && currentStep && (
                <>
                  {allRequiredUploaded ? (
                    <p className="text-xs text-green-600 text-center bg-green-50 rounded-lg px-3 py-2 font-medium">
                      ✓ อัปโหลดครบแล้ว — กดส่งได้เลย
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                      ⚠️ กรุณาอัปโหลดเอกสารที่ยังรอให้ครบก่อน
                    </p>
                  )}
                  <button
                    disabled={!allRequiredUploaded}
                    onClick={() => {
                      approveCurrentStep(sub.id);
                      const lbl = SUBMIT_LABEL[subType]?.[currentStep.stepOrder] ?? "ส่งเอกสารแล้ว";
                      showToast(`${lbl} ✓`);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 text-white rounded-xl font-semibold transition ${
                      allRequiredUploaded
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    {SUBMIT_LABEL[subType]?.[currentStep.stepOrder] ?? "ยืนยันการส่งเอกสาร"}
                  </button>
                </>
              )}

              {/* Cancel — always available while in progress */}
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
              >
                <XCircle className="w-4 h-4" />
                ยกเลิกคำร้องนี้
              </button>
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
