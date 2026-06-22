"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { SubmissionStatusBadge, StepStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, getStepName, PROGRAM_LABELS, formatBytes, formatDate, previewFile } from "@/lib/utils";
import { MockWorkflowStep, MockUpload } from "@/types";
import Link from "next/link";
import {
  ArrowLeft, Download, FileText, Pencil, Check, X,
  Trash2, ShieldCheck, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, User, Upload,
} from "lucide-react";
import { FileList } from "@/components/FileList";
import { FileUploader } from "@/components/FileUploader";

// ─── Step control card ────────────────────────────────────────────────────────

function StepCard({
  step,
  isCurrentStep,
  onOverride,
  stepUploads,
  assignedName,
  committeeStatus,
  submissionType,
  displayOrder,
  financeAdminName,
}: {
  step: MockWorkflowStep;
  isCurrentStep: boolean;
  onOverride: (stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) => Promise<void>;
  stepUploads: MockUpload[];
  assignedName?: string | null;
  committeeStatus?: { name: string; signed: boolean; approved: boolean }[];
  submissionType?: string | null;
  displayOrder: number;
  financeAdminName?: string | null;
}) {
  const [open,    setOpen]    = useState(false);
  const [action,  setAction]  = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const borderColor =
    step.status === "APPROVED" ? "border-green-200 bg-green-50"
    : step.status === "REJECTED" ? "border-red-200 bg-red-50"
    : isCurrentStep ? "border-blue-300 bg-blue-50"
    : "border-gray-100 bg-white";

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${borderColor}`}>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase">ขั้นที่ {displayOrder}</span>
            <span className="font-semibold text-gray-800">{getStepName(step.stepOrder, submissionType) || ROLE_LABELS[step.role]}</span>
            {isCurrentStep && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                ● กำลังดำเนินการ
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{ROLE_LABELS[step.role]}</p>
          {assignedName && !step.actedByName && (
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {assignedName}
            </p>
          )}
          {financeAdminName && (
            <p className="text-sm text-yellow-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {financeAdminName} <span className="text-gray-400 text-xs">(อัปโหลดเอกสารการเงิน)</span>
            </p>
          )}
          {step.actedByName && (
            <p className="text-sm text-gray-500">
              โดย <span className="font-medium text-gray-700">{step.actedByName}</span>
              {step.actedAt && <span className="text-gray-400"> · {formatDate(step.actedAt)}</span>}
            </p>
          )}
          {step.notes && (
            <p className="text-sm text-gray-500 italic">"{step.notes}"</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StepStatusBadge status={step.status} />
          <button
            onClick={() => { setOpen(!open); setErrMsg(null); }}
            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
          >
            <ShieldCheck className="w-4 h-4" />
            จัดการ
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Uploaded files for this step */}
      {stepUploads.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {stepUploads.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-xs text-gray-600 truncate flex-1">{FORM_LABELS[u.formType]} — {u.fileName} <span className="text-gray-400">({formatBytes(u.fileSize)})</span></span>
              <button
                onClick={() => previewFile(u.fileUrl, u.fileName)}
                className="shrink-0 text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <Download className="w-3 h-3" />
                ดาวน์โหลด
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Committee sign status */}
      {committeeStatus && committeeStatus.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">สถานะลงนามกรรมการ</p>
          {committeeStatus.map((m) => (
            <div key={m.name} className="flex items-center gap-2">
              {m.signed ? (
                m.approved
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-gray-300 shrink-0" />
              )}
              <span className={`text-sm ${m.signed ? (m.approved ? "text-green-700" : "text-red-600") : "text-gray-500"}`}>
                {m.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                m.signed
                  ? m.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {m.signed ? (m.approved ? "อนุมัติ" : "ปฏิเสธ") : "รอลงนาม"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable admin controls */}
      {open && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-600">บังคับเปลี่ยนสถานะขั้นนี้:</p>

          <div className="flex gap-2">
            <button
              onClick={() => setAction("APPROVED")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition ${
                action === "APPROVED"
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              อนุมัติ
            </button>
            <button
              onClick={() => setAction("REJECTED")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition ${
                action === "REJECTED"
                  ? "bg-red-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-red-400"
              }`}
            >
              <XCircle className="w-4 h-4" />
              ปฏิเสธ
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุสำหรับการแก้ไข (ไม่บังคับ)..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          {errMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{errMsg}</p>
          )}
          <div className="flex gap-2">
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setErrMsg(null);
                try {
                  await onOverride(step.stepOrder, action, notes || undefined);
                  setOpen(false);
                  setNotes("");
                } catch (e) {
                  setErrMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
                } finally {
                  setSaving(false);
                }
              }}
              className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "กำลังบันทึก..." : "ยืนยันการแก้ไข"}
            </button>
            <button
              onClick={() => { setOpen(false); setNotes(""); setErrMsg(null); }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSubmissionDetail() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { submissions, users, adminUpdateSubmission, adminDeleteSubmission, adminOverrideStep, approveCurrentStep, rejectCurrentStep } = useApp();

  const sub = submissions.find((s) => s.id === id);

  const pendingStep$ = sub?.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn = pendingStep$?.role === "ADMIN";
  const isThesisRelayStep  = sub?.submissionType === "THESIS_DEFENSE" && pendingStep$?.stepOrder === 7;
  const isThesisUploadStep = sub?.submissionType === "THESIS_DEFENSE" && pendingStep$?.stepOrder === 8;
  const isProposalFinanceStep = sub?.submissionType === "PROPOSAL" && pendingStep$?.stepOrder === 4;
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectNotes,  setRejectNotes]  = useState("");
  const [showReject,   setShowReject]   = useState(false);

  const [editMode,    setEditMode]    = useState(false);
  const [editTitle,   setEditTitle]   = useState(sub?.title ?? "");
  const [editAdvisor, setEditAdvisor] = useState(sub?.advisorId ?? "");
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<"steps" | "timeline">("steps");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!sub) {
    return (
      <div className="text-center py-20 space-y-3 text-gray-400">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
        <Link href="/dashboard/admin" className="text-blue-500 hover:underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const allUsers   = users;
  const student    = allUsers.find((u) => u.id === sub.studentId);
  const advisor    = allUsers.find((u) => u.id === sub.advisorId);
  const advisors   = allUsers.filter((u) => u.role === "ADVISOR");
  const currentOrd = sub.workflowSteps.find((s) => s.status === "PENDING")?.stepOrder ?? null;
  const doneCount  = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps = sub.workflowSteps.length;

  function saveEdit() {
    if (!sub || !editTitle.trim()) return;
    adminUpdateSubmission(sub.id, { title: editTitle.trim(), advisorId: editAdvisor || undefined });
    setEditMode(false);
  }

  function handleDelete() {
    if (!sub) return;
    adminDeleteSubmission(sub.id);
    router.push("/dashboard/admin");
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back */}
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium">
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับรายการ
      </Link>

      {/* Admin badge */}
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
        <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
        <span className="text-sm font-semibold text-orange-700">
          โหมด Admin — สามารถจัดการและแก้ไขทุกขั้นตอนได้
        </span>
      </div>

      {/* ─── Admin's own approval panel ─────────────────────────────────── */}
      {isMyTurn && (
        <div className="bg-white border-2 border-blue-400 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-blue-800 text-lg">
              {isThesisRelayStep
                ? "ถึงคิวของท่าน — นำส่งเอกสารไปยังคณะ"
                : isThesisUploadStep
                ? "ถึงคิวของท่าน — อัปโหลดเอกสารจากคณะ"
                : "ถึงคิวของท่าน — กรุณาตรวจรับและอนุมัติเอกสาร"}
            </h2>
          </div>
          {isThesisRelayStep ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p>ขั้นตอนนี้ต้องดำเนินการทางกายภาพก่อนกดอนุมัติ:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-gray-700">
                <li>พิมพ์ / รวบรวม บ.2 + บ.3 จากระบบ</li>
                <li>นำส่งไปยังคณะวิศวกรรมศาสตร์</li>
                <li>กดอนุมัติเพื่อยืนยันว่านำส่งแล้ว (รอรับเอกสารกลับในขั้นถัดไป)</li>
              </ol>
            </div>
          ) : isThesisUploadStep ? (
            <div className="space-y-3 text-sm text-gray-600">
              <p>รับเอกสารจากคณะแล้วอัปโหลดก่อนกดอนุมัติ:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-gray-700">
                <li>รับเอกสารจากคณะ (ใบรายงานผลการสอบ · แบบรายงานฯ · invitation letter · แบบประเมิน ถ้ามี)</li>
                <li>อัปโหลดเอกสารทั้งหมดด้านล่าง</li>
                <li>ส่งต่อเอกสารให้นิสิต</li>
                <li>กดอนุมัติเพื่อแจ้งให้นิสิตดำเนินขั้นถัดไป</li>
              </ol>
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> อัปโหลดเอกสารจากคณะ (SIGNED)
                </p>
                <FileUploader submissionId={sub.id} formType="SIGNED" />
                <p className="text-xs text-gray-400">อัปโหลดซ้ำได้หลายครั้ง — แต่ละไฟล์จะแสดงแยกกัน</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 pt-1">
                  <Upload className="w-3.5 h-3.5" /> เอกสารการเงิน (FINANCE_DOC)
                </p>
                <FileUploader submissionId={sub.id} formType="FINANCE_DOC" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">ตรวจสอบเอกสารที่นักศึกษาอัปโหลด แล้วอนุมัติเพื่อส่งต่อไปยังขั้นถัดไป หรือปฏิเสธหากเอกสารไม่ครบถ้วน</p>
          )}

          {!showReject ? (
            <div className="space-y-3">
              {isThesisUploadStep && !sub.uploads.some((u) => u.formType === "SIGNED") && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ กรุณาอัปโหลดเอกสารจากคณะอย่างน้อย 1 ไฟล์ก่อนกดอนุมัติ
                </p>
              )}
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="หมายเหตุ (ไม่บังคับ)..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button
                  disabled={isThesisUploadStep && !sub.uploads.some((u) => u.formType === "SIGNED")}
                  onClick={() => { approveCurrentStep(sub.id, approveNotes || undefined); setApproveNotes(""); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  อนุมัติและส่งต่อ
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="px-5 py-3 border-2 border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition"
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
          ) : (
            <RejectForm
              onConfirm={(notes) => { rejectCurrentStep(sub.id, notes); setShowReject(false); }}
              onCancel={() => setShowReject(false)}
            />
          )}
        </div>
      )}

      {/* Admin can reject at ANY step — shown when it's not admin's own turn */}
      {!isMyTurn && sub.status === "IN_PROGRESS" && (
        <AdminRejectAnyStep
          onConfirm={(notes) => rejectCurrentStep(sub.id, notes)}
        />
      )}

      {/* PROPOSAL step 4: admin must upload FINANCE_DOC while student uploads B1C+B1D */}
      {isProposalFinanceStep && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800 text-lg">อัปโหลดเอกสารการเงิน</h2>
          </div>
          <p className="text-sm text-gray-600">
            ขณะที่นิสิตกำลังอัปโหลด บ.วศ.1ค + บ.วศ.1ง — ท่านต้องอัปโหลดเอกสารการเงินด้วย
            นิสิตจึงจะสามารถส่งขั้นตอนนี้ได้
          </p>
          <FileUploader submissionId={sub.id} formType="FINANCE_DOC" />
        </div>
      )}

      {/* Header + edit */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            {!editMode ? (
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
            ) : (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold border-2 border-blue-400 rounded-xl px-3 py-2 focus:outline-none"
                autoFocus
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SubmissionStatusBadge status={sub.status} />
            {!editMode ? (
              <button
                onClick={() => { setEditMode(true); setEditTitle(sub.title); setEditAdvisor(sub.advisorId ?? ""); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition"
              >
                <Pencil className="w-4 h-4" />
                แก้ไข
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditMode(false)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-0.5">นักศึกษา</p>
            <p className="font-medium text-gray-800">{student?.name}</p>
            {student?.studentId && <p className="text-gray-400 text-xs">{student.studentId}</p>}
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">อาจารย์ที่ปรึกษา</p>
            {!editMode ? (
              <p className="font-medium text-gray-800">{advisor?.name ?? "—"}</p>
            ) : (
              <select
                value={editAdvisor}
                onChange={(e) => setEditAdvisor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">— ไม่ระบุ —</option>
                {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">วันที่ยื่น</p>
            <p className="font-medium text-gray-800">{formatDate(sub.createdAt)}</p>
          </div>
        </div>

        {/* Exam appointment info */}
        {(sub.examDate || sub.program || sub.headCommitteeId || sub.committeeIds?.length) && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ข้อมูลการสอบ</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {sub.program && (
                <AdminInfoItem label="หลักสูตร" value={PROGRAM_LABELS[sub.program] ?? sub.program} />
              )}
              {sub.examDate && (
                <AdminInfoItem label="วันที่สอบ" value={`${sub.examDate}${sub.examTime ? ` เวลา ${sub.examTime} น.` : ""}`} />
              )}
              {sub.studentEmail && (
                <AdminInfoItem label="อีเมลนิสิต" value={sub.studentEmail} />
              )}
              {sub.studentPhone && (
                <AdminInfoItem label="เบอร์โทรนิสิต" value={sub.studentPhone} />
              )}
              {sub.roomNeeded && (
                <AdminInfoItem label="ห้องประชุม" value="ต้องการ" />
              )}
              {sub.parkingNeeded && sub.carPlate && (
                <AdminInfoItem label="ที่จอดรถ (ทะเบียน)" value={sub.carPlate} />
              )}
              {sub.headCommitteeId && (
                <AdminInfoItem label="ประธานกรรมการสอบ" value={allUsers.find((u) => u.id === sub.headCommitteeId)?.name ?? sub.headCommitteeId} />
              )}
              {sub.committeeIds?.map((id, i) => (
                <AdminInfoItem key={id} label={`กรรมการสอบ ${i + 1}`} value={allUsers.find((u) => u.id === id)?.name ?? id} />
              ))}
            </div>
          </div>
        )}

        {/* External professor info */}
        {(sub.invitedProfName || sub.invitedCommitteeId) && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-purple-600 uppercase">กรรมการภายนอก (External Committee)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {sub.invitedProfName && (
                <div>
                  <p className="text-xs text-purple-400">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-purple-900">{sub.invitedProfName}</p>
                </div>
              )}
              {sub.invitedProfAffiliation && (
                <div>
                  <p className="text-xs text-purple-400">สังกัด</p>
                  <p className="font-medium text-purple-900">{sub.invitedProfAffiliation}</p>
                </div>
              )}
              {sub.invitedProfEmail && (
                <div>
                  <p className="text-xs text-purple-400">อีเมล</p>
                  <p className="font-medium text-purple-900 break-all">{sub.invitedProfEmail}</p>
                </div>
              )}
              {sub.invitedProfPhone && (
                <div>
                  <p className="text-xs text-purple-400">เบอร์โทร</p>
                  <p className="font-medium text-purple-900">{sub.invitedProfPhone}</p>
                </div>
              )}
              {!sub.invitedProfName && sub.invitedCommitteeId && (
                <div>
                  <p className="text-xs text-purple-400">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-purple-900">{allUsers.find((u) => u.id === sub.invitedCommitteeId)?.name ?? sub.invitedCommitteeId}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(doneCount / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 shrink-0">{doneCount}/{totalSteps} ขั้น</span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Steps control */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switch */}
          <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4">
            <button
              onClick={() => setActiveTab("steps")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "steps"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🎛️ จัดการแต่ละขั้นตอน
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 ไทม์ไลน์
            </button>
          </div>

          {activeTab === "steps" ? (
            <div className="space-y-3">
              {sub.workflowSteps.filter((s) => s.status !== "SKIPPED").map((step, i, visible) => {
                const allIdx = sub.workflowSteps.indexOf(step);
                const prevActedAt = allIdx > 0 ? sub.workflowSteps[allIdx - 1].actedAt : null;
                const stepUploads = sub.uploads.filter((u) => {
                  const t = new Date(u.uploadedAt).getTime();
                  const from = prevActedAt ? new Date(prevActedAt).getTime() : 0;
                  const to = step.actedAt ? new Date(step.actedAt).getTime() : Infinity;
                  return t >= from && t <= to;
                });

                // Resolve who is assigned to this step
                let assignedName: string | null = null;
                if (step.role === "STUDENT") assignedName = student?.name ?? null;
                else if (step.role === "ADMIN") assignedName = allUsers.find((u) => u.role === "ADMIN")?.name ?? null;
                else if (step.role === "ADVISOR") assignedName = advisor?.name ?? null;
                else if (step.role === "CO_ADVISOR") assignedName = (sub.coAdvisorIds ?? []).map((uid: string) => allUsers.find((u) => u.id === uid)?.name ?? uid).join(", ") || null;
                else if (step.role === "HEAD_EXAM_COMMITTEE") assignedName = allUsers.find((u) => u.id === sub.headCommitteeId)?.name ?? null;
                else if (step.role === "INVITED_EXAM_COMMITTEE") assignedName = allUsers.find((u) => u.id === sub.invitedCommitteeId)?.name ?? (sub.invitedProfName ?? null);
                else if (step.role === "PROGRAM_CHAIR") assignedName = allUsers.find((u) => u.role === "PROGRAM_CHAIR")?.name ?? null;

                // Committee sign breakdown
                const committeeStatus = (step.role === "EXAM_COMMITTEE" || step.role === "CO_ADVISOR")
                  ? (step.committeeMembers?.length ? step.committeeMembers : (step.role === "CO_ADVISOR" ? (sub.coAdvisorIds ?? []) : (sub.committeeIds ?? []))).map((uid) => {
                      const u = allUsers.find((u) => u.id === uid);
                      const action = step.committeeActions?.find((a) => a.userId === uid);
                      return { name: u?.name ?? uid, signed: !!action, approved: action?.decision === "APPROVED" };
                    })
                  : undefined;

                const isFutureStep = step.status === "PENDING" && step.stepOrder !== currentOrd;

                const financeAdminName =
                  sub.submissionType === "PROPOSAL" && step.stepOrder === 4
                    ? allUsers.find((u) => u.role === "ADMIN")?.name ?? null
                    : null;

                return (
                  <StepCard
                    key={step.id}
                    step={step}
                    stepUploads={isFutureStep ? [] : stepUploads}
                    isCurrentStep={step.stepOrder === currentOrd}
                    assignedName={assignedName}
                    committeeStatus={committeeStatus}
                    submissionType={sub.submissionType}
                    displayOrder={i + 1}
                    financeAdminName={financeAdminName}
                    onOverride={(stepOrder, action, notes) =>
                      adminOverrideStep(sub.id, stepOrder, action, notes)
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 p-6">
              <WorkflowTimeline steps={sub.workflowSteps} users={allUsers} submissionType={sub.submissionType} submission={sub} />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Current status summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">สถานะปัจจุบัน</h2>
            {currentOrd ? (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">
                    ขั้นที่ {currentOrd}: {ROLE_LABELS[sub.workflowSteps[currentOrd - 1]?.role]}
                  </p>
                  <p className="text-xs text-orange-600">กำลังรอดำเนินการ</p>
                </div>
              </div>
            ) : sub.status === "COMPLETED" ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-800">ผ่านทุกขั้นตอนแล้ว</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-800">ถูกปฏิเสธ</p>
              </div>
            )}
          </div>

          {/* Documents — grouped by form type */}
          {sub.uploads.length > 0 && (
            <FileList uploads={sub.uploads} submissionTitle={sub.title} />
          )}

          {/* Delete */}
          <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3">
            <h2 className="font-semibold text-red-700">ลบคำร้อง</h2>
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition"
              >
                <Trash2 className="w-5 h-5" />
                ลบคำร้องนี้
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600">
                  พิมพ์ <span className="font-bold font-mono">ลบ</span> เพื่อยืนยัน — การลบไม่สามารถกู้คืนได้
                </p>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="พิมพ์ว่า 'ลบ'"
                  className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (deleteConfirm === "ลบ") handleDelete(); }}
                    disabled={deleteConfirm !== "ลบ"}
                    className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ยืนยันลบ
                  </button>
                  <button
                    onClick={() => { setConfirmDel(false); setDeleteConfirm(""); }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function AdminInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 text-sm">{value}</p>
    </div>
  );
}

function RejectForm({ onConfirm, onCancel }: { onConfirm: (notes: string) => void; onCancel: () => void }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="เหตุผลการปฏิเสธ..."
        autoFocus
        className="w-full border border-red-300 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <div className="flex gap-2">
        <button
          disabled={!notes.trim()}
          onClick={() => onConfirm(notes.trim())}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ยืนยันปฏิเสธ
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

function AdminRejectAnyStep({ onConfirm }: { onConfirm: (notes: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700">ปฏิเสธคำร้อง</p>
            <p className="text-xs text-red-500">รีเซ็ตทุกขั้นตอนกลับไปที่ขั้นที่ 1</p>
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 border-2 border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition text-sm"
          >
            ปฏิเสธ
          </button>
        )}
      </div>
      {open && (
        <RejectForm
          onConfirm={(notes) => { onConfirm(notes); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}
