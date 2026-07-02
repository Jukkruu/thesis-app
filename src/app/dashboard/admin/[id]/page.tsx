"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { SubmissionStatusBadge, StepStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, getStepName, PROGRAM_LABELS, formatBytes, formatDate, previewFile } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { MockWorkflowStep, MockUpload } from "@/types";
import Link from "next/link";
import {
  ArrowLeft, Download, FileText, Pencil, Check, X,
  Trash2, ShieldCheck, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, User, Users, CalendarDays, Upload,
} from "lucide-react";
import { FileList } from "@/components/FileList";
import { FileUploader } from "@/components/FileUploader";
import { SignatureButton } from "@/components/SignatureButton";

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
  const { user, submissions, users, adminUpdateSubmission, adminDeleteSubmission, adminOverrideStep, approveCurrentStep, rejectCurrentStep } = useApp();

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

  if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    router.replace(ROLE_ROUTES[user.role] ?? "/login");
    return null;
  }

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
  const currentOrd        = sub.workflowSteps.find((s) => s.status === "PENDING")?.stepOrder ?? null;
  const visibleSteps      = sub.workflowSteps.filter((s) => s.status !== "SKIPPED");
  const currentDisplayOrd = currentOrd !== null
    ? (visibleSteps.findIndex((s) => s.stepOrder === currentOrd) + 1) || null
    : null;
  const doneCount  = visibleSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps = visibleSteps.length;

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
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium py-2 -my-2">
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

      {/* Header + edit */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
        <div className="flex items-start flex-wrap gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {!editMode ? (
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
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
        {(sub.examDate || sub.program || sub.headCommitteeId || sub.committeeIds?.length || sub.studentFullName) && (
          <div className="border-t border-gray-100 pt-4 space-y-4">

            {/* Student info */}
            {(sub.studentFullName || sub.studentCode || sub.program || sub.studentEmail || sub.studentPhone) && (
              <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><User className="w-3.5 h-3.5" />ข้อมูลนิสิต</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {sub.studentFullName && <AdminInfoItem label="ชื่อ-นามสกุล" value={sub.studentFullName} />}
                {sub.studentCode && <AdminInfoItem label="รหัสนิสิต" value={sub.studentCode} />}
                {sub.program && <AdminInfoItem label="หลักสูตร" value={PROGRAM_LABELS[sub.program] ?? sub.program} />}
                {sub.studentEmail && <AdminInfoItem label="อีเมล" value={sub.studentEmail} />}
                {sub.studentPhone && <AdminInfoItem label="เบอร์โทร" value={sub.studentPhone} />}
              </div>
              </div>
            )}

            {/* Committee */}
            {(advisor || sub.headCommitteeId || (sub.coAdvisorIds?.length ?? 0) > 0 || (sub.committeeIds?.length ?? 0) > 0 || sub.invitedProfName || sub.invitedCommitteeId) && (
              <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><Users className="w-3.5 h-3.5" />คณะกรรมการ</div>
              <div className="space-y-2">
                {advisor && <AdminInfoRow label="อาจารย์ที่ปรึกษา" value={advisor.name} />}
                {sub.headCommitteeId && (
                  <AdminInfoRow label="ประธานกรรมการสอบ" value={allUsers.find((u) => u.id === sub.headCommitteeId)?.name ?? sub.headCommitteeId!} />
                )}
                {(sub.coAdvisorIds?.length ?? 0) > 0 && (
                  <AdminInfoRow
                    label="อาจารย์ที่ปรึกษาร่วม"
                    value={(sub.coAdvisorIds ?? []).map((uid: string) => allUsers.find((u) => u.id === uid)?.name ?? uid).join(", ")}
                  />
                )}
                {(sub.committeeIds?.length ?? 0) > 0 && (
                  <div className="flex gap-4">
                    <p className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">กรรมการสอบ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(sub.committeeIds ?? []).map((uid: string) => (
                        <span key={uid} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg">
                          {allUsers.find((u) => u.id === uid)?.name ?? uid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(sub.invitedProfName || sub.invitedCommitteeId) && (
                  <div className="space-y-2 pt-1">
                    <AdminInfoRow
                      label="กรรมการภายนอก"
                      value={sub.invitedProfName ?? allUsers.find((u) => u.id === sub.invitedCommitteeId)?.name ?? sub.invitedCommitteeId!}
                    />
                    {sub.invitedProfAffiliation && <AdminInfoRow label="สังกัด" value={sub.invitedProfAffiliation} />}
                    {sub.invitedProfEmail && <AdminInfoRow label="อีเมลกรรมการภายนอก" value={sub.invitedProfEmail} />}
                    {sub.invitedProfPhone && <AdminInfoRow label="เบอร์โทรกรรมการภายนอก" value={sub.invitedProfPhone} />}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Schedule */}
            {(sub.examDate || sub.roomNeeded || (sub.parkingNeeded && sub.carPlate)) && (
              <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><CalendarDays className="w-3.5 h-3.5" />กำหนดการสอบ</div>
              <div className="space-y-2">
                {sub.examDate && <AdminInfoRow label="วันที่สอบ" value={`${sub.examDate}${sub.examTime ? ` เวลา ${sub.examTime} น.` : ""}`} />}
                {sub.roomNeeded && <AdminInfoRow label="ห้องประชุม" value="ต้องการ" />}
                {sub.parkingNeeded && sub.carPlate && <AdminInfoRow label="ทะเบียนรถ" value={sub.carPlate} />}
              </div>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0}%` }}
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
                // Walk backwards skipping SKIPPED steps (which have actedAt: null) to find last real timestamp
                const prevActedAt = sub.workflowSteps
                  .slice(0, allIdx)
                  .reverse()
                  .find((s) => s.actedAt != null)?.actedAt ?? null;
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
                      const stepApproved = step.status === "APPROVED";
                      return { name: u?.name ?? uid, signed: stepApproved || !!action, approved: stepApproved || action?.decision === "APPROVED" };
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

          {/* Task description card — numbered instructions for special admin steps */}
          {isMyTurn && sub.status !== "REJECTED" && (isThesisRelayStep || isThesisUploadStep) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-blue-800">
                  {isThesisRelayStep ? "สิ่งที่ต้องดำเนินการ" : "สิ่งที่ต้องดำเนินการ"}
                </h2>
              </div>
              {isThesisRelayStep ? (
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-sm text-gray-700">
                  <li>พิมพ์ / รวบรวม บ.2 + บ.3 จากระบบ</li>
                  <li>นำส่งไปยังคณะวิศวกรรมศาสตร์</li>
                  <li>กดอนุมัติเพื่อยืนยันว่านำส่งแล้ว</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-sm text-gray-700">
                  <li>รับเอกสารจากคณะวิศวกรรมศาสตร์</li>
                  <li>อัปโหลดเอกสารด้านล่าง</li>
                  <li>กดส่งต่อ — ระบบจะแจ้งนิสิตโดยอัตโนมัติ</li>
                </ol>
              )}
            </div>
          )}

          {/* Admin's action panel — SignatureButton for upload steps, simple approve for others */}
          {isMyTurn && sub.status !== "REJECTED" && (
            isThesisUploadStep ? (
              <SignatureButton
                submissionId={sub.id}
                label="ส่งต่อนิสิต"
                onSuccess={() => {}}
                hideDownloads={true}
              />
            ) : (
              <div className="bg-white border-2 border-blue-400 rounded-2xl p-5 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">ดำเนินการ</h3>
                {!isThesisRelayStep && (
                  <p className="text-sm text-gray-500">ตรวจสอบเอกสาร แล้วอนุมัติหรือปฏิเสธ</p>
                )}
                {!showReject ? (
                  <div className="space-y-3">
                    <textarea
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      placeholder="หมายเหตุ (ไม่บังคับ)..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { approveCurrentStep(sub.id, approveNotes || undefined); setApproveNotes(""); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => setShowReject(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition"
                      >
                        <XCircle className="w-5 h-5" />
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
            )
          )}

          {/* PROPOSAL step 4: upload FINANCE_DOC in parallel while student uploads B1C+B1D */}
          {isProposalFinanceStep && (
            sub.uploads.some((u) => u.formType === "FINANCE_DOC") ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold text-green-800">อัปโหลดเอกสารการเงินแล้ว</h2>
                </div>
                <p className="text-sm text-gray-600">กำลังรอนิสิตส่ง บ.วศ.1ค + บ.วศ.1ง — ระบบจะดำเนินต่อโดยอัตโนมัติ</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-yellow-600" />
                  <h2 className="font-semibold text-yellow-800">อัปโหลดเอกสารการเงิน</h2>
                </div>
                <p className="text-sm text-gray-600">
                  ขณะที่นิสิตกำลังอัปโหลด บ.วศ.1ค + บ.วศ.1ง — ท่านต้องอัปโหลดเอกสารการเงินด้วย
                </p>
                <FileUploader submissionId={sub.id} formType="FINANCE_DOC" />
              </div>
            )
          )}

          {/* Waiting-for-resubmit — admin is the prevStep role, blocked until student resubmits */}
          {isMyTurn && sub.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                <Clock className="w-5 h-5" />
                รอนักศึกษายืนยันการแก้ไข
              </div>
              <p className="text-red-600 text-sm mt-1">คำร้องถูกปฏิเสธ — นักศึกษาต้องกด "แก้ไขและยื่นใหม่" ก่อน</p>
            </div>
          )}

          {/* Current status summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">สถานะปัจจุบัน</h2>
            {currentOrd ? (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">
                    ขั้นที่ {currentDisplayOrd}: {ROLE_LABELS[sub.workflowSteps.find((s) => s.stepOrder === currentOrd)?.role ?? "ADMIN"]}
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
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function AdminInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <p className="text-xs text-gray-400 w-24 sm:w-32 shrink-0 pt-0.5">{label}</p>
      <p className="text-sm text-gray-800 flex-1 break-all">{value}</p>
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

