"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { SubmissionStatusBadge, StepStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, STEP_NAMES, formatBytes, formatDate, downloadMockFile } from "@/lib/utils";
import { MockWorkflowStep } from "@/types";
import Link from "next/link";
import {
  ArrowLeft, Download, FileText, Pencil, Check, X,
  Trash2, ShieldCheck, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, StickyNote,
} from "lucide-react";

// ─── Step control card ────────────────────────────────────────────────────────

function StepCard({
  step,
  isCurrentStep,
  onOverride,
}: {
  step: MockWorkflowStep;
  isCurrentStep: boolean;
  onOverride: (stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [action, setAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [notes,  setNotes]  = useState("");

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
            <span className="text-xs font-semibold text-gray-400 uppercase">ขั้นที่ {step.stepOrder}</span>
            <span className="font-semibold text-gray-800">{STEP_NAMES[step.stepOrder]}</span>
            {isCurrentStep && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                ● กำลังดำเนินการ
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{ROLE_LABELS[step.role]}</p>
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
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
          >
            <ShieldCheck className="w-4 h-4" />
            จัดการ
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

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

          <div className="flex gap-2">
            <button
              onClick={() => {
                onOverride(step.stepOrder, action, notes || undefined);
                setOpen(false);
                setNotes("");
              }}
              className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition text-sm"
            >
              ยืนยันการแก้ไข
            </button>
            <button
              onClick={() => { setOpen(false); setNotes(""); }}
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
  const { submissions, users, adminUpdateSubmission, adminDeleteSubmission, adminOverrideStep, adminSetNote, approveCurrentStep, rejectCurrentStep } = useApp();

  const sub = submissions.find((s) => s.id === id);

  const isMyTurn = sub?.workflowSteps.find((s) => s.status === "PENDING")?.role === "ADMIN";
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectNotes,  setRejectNotes]  = useState("");
  const [showReject,   setShowReject]   = useState(false);

  const [editMode,    setEditMode]    = useState(false);
  const [editTitle,   setEditTitle]   = useState(sub?.title ?? "");
  const [editAdvisor, setEditAdvisor] = useState(sub?.advisorId ?? "");
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<"steps" | "timeline">("steps");
  const [noteText,    setNoteText]    = useState(sub?.adminNote ?? "");
  const [noteSaved,   setNoteSaved]   = useState(false);

  if (!sub) {
    return (
      <div className="text-center py-20 space-y-3 text-gray-400">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
        <Link href="/dashboard/admin" className="text-blue-500 hover:underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const allUsers   = users.length ? users : MOCK_USERS;
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
            <h2 className="font-semibold text-blue-800 text-lg">ถึงคิวของท่าน — กรุณาตรวจรับและอนุมัติเอกสาร</h2>
          </div>
          <p className="text-sm text-gray-500">ตรวจสอบเอกสารที่นักศึกษาอัปโหลด แล้วอนุมัติเพื่อส่งต่อไปยังขั้นถัดไป หรือปฏิเสธหากเอกสารไม่ครบถ้วน</p>

          {!showReject ? (
            <div className="space-y-3">
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="หมายเหตุ (ไม่บังคับ)..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { approveCurrentStep(sub.id, approveNotes || undefined); setApproveNotes(""); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
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
            <div className="space-y-3">
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="เหตุผลการปฏิเสธ (จำเป็น)..."
                className="w-full border border-red-300 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!rejectNotes.trim()) return;
                    rejectCurrentStep(sub.id, rejectNotes);
                    setRejectNotes("");
                    setShowReject(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
                >
                  ยืนยันปฏิเสธ
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
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
              {sub.workflowSteps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isCurrentStep={step.stepOrder === currentOrd}
                  onOverride={(stepOrder, action, notes) =>
                    adminOverrideStep(sub.id, stepOrder, action, notes)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 p-6">
              <WorkflowTimeline steps={sub.workflowSteps} users={allUsers} />
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

          {/* Documents */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">เอกสารแนบ ({sub.uploads.length})</h2>
              <ul className="space-y-3">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 leading-snug">{FORM_LABELS[u.formType]}</p>
                      <p className="text-xs text-gray-400 truncate">{u.fileName} · {formatBytes(u.fileSize)}</p>
                    </div>
                    <button
                      onClick={() => downloadMockFile(u.fileName, FORM_LABELS[u.formType], sub.title)}
                      className="shrink-0 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin note — visible to all parties */}
          <div className="bg-white rounded-2xl border border-yellow-200 p-5 space-y-3">
            <h2 className="font-semibold text-yellow-700 flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              บันทึกจาก Admin
            </h2>
            <p className="text-xs text-gray-500">บันทึกนี้จะปรากฏแก่นักศึกษาและทุกฝ่ายที่เกี่ยวข้อง</p>
            <textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false); }}
              placeholder="เพิ่มบันทึกหรือคำแนะนำ..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {noteSaved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> บันทึกแล้ว
              </p>
            )}
            <button
              onClick={() => {
                if (!sub) return;
                adminSetNote(sub.id, noteText);
                setNoteSaved(true);
              }}
              className="w-full py-2.5 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition text-sm"
            >
              บันทึก
            </button>
          </div>

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
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-medium text-center">
                  ยืนยันการลบ? ไม่สามารถกู้คืนได้
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
                  >
                    ยืนยันลบ
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
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
