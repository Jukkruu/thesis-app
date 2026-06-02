"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { SubmissionStatusBadge, StepStatusBadge } from "@/components/StatusBadge";
import { FORM_LABELS, ROLE_LABELS, STEP_NAMES, formatBytes, formatDate } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, FileText, Pencil, Check, X,
  Trash2, ShieldCheck,
} from "lucide-react";

export default function AdminSubmissionDetail() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const {
    submissions,
    adminUpdateSubmission,
    adminDeleteSubmission,
    adminOverrideStep,
  } = useApp();

  const sub = submissions.find((s) => s.id === id);

  // Edit info state
  const [editMode,    setEditMode]    = useState(false);
  const [editTitle,   setEditTitle]   = useState(sub?.title ?? "");
  const [editAdvisor, setEditAdvisor] = useState(sub?.advisorId ?? "");

  // Override step state
  const [overrideStep,   setOverrideStep]   = useState<number | null>(null);
  const [overrideAction, setOverrideAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [overrideNotes,  setOverrideNotes]  = useState("");

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!sub) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
        <Link href="/dashboard/admin" className="text-blue-500 mt-2 inline-block">กลับหน้าแดชบอร์ด</Link>
      </div>
    );
  }

  const student = MOCK_USERS.find((u) => u.id === sub.studentId);
  const advisor = MOCK_USERS.find((u) => u.id === sub.advisorId);
  const advisors = MOCK_USERS.filter((u) => u.role === "ADVISOR");

  function saveEdit() {
    if (!editTitle.trim() || !sub) return;
    adminUpdateSubmission(sub.id, {
      title:     editTitle.trim(),
      advisorId: editAdvisor || undefined,
    });
    setEditMode(false);
  }

  function handleOverride() {
    if (overrideStep === null || !sub) return;
    adminOverrideStep(sub.id, overrideStep, overrideAction, overrideNotes || undefined);
    setOverrideStep(null);
    setOverrideNotes("");
  }

  function handleDelete() {
    if (!sub) return;
    adminDeleteSubmission(sub.id);
    router.push("/dashboard/admin");
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium">
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับ
      </Link>

      {/* Admin badge */}
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
        <ShieldCheck className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-semibold text-orange-700">โหมดผู้ดูแลระบบ — คุณสามารถแก้ไขข้อมูลได้</span>
      </div>

      {/* Title + status */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          {!editMode ? (
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          ) : (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold border-2 border-blue-400 rounded-xl px-3 py-1 focus:outline-none"
            />
          )}
          <p className="text-gray-500 text-sm">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">ขั้นตอนการดำเนินการ</h2>
            <WorkflowTimeline steps={sub.workflowSteps} />
          </div>

          {/* Admin: Override any step */}
          <div className="bg-white rounded-2xl border border-orange-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              บังคับผ่าน / ปฏิเสธขั้นตอน (Admin Override)
            </h2>
            <p className="text-sm text-gray-500">ใช้เมื่อข้อมูลผิดพลาด หรือต้องการข้ามขั้นตอนในระบบ</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sub.workflowSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setOverrideStep(step.stepOrder);
                    setOverrideAction("APPROVED");
                    setOverrideNotes("");
                  }}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      ขั้นที่ {step.stepOrder}: {ROLE_LABELS[step.role]}
                    </p>
                    <p className="text-xs text-gray-400">{STEP_NAMES[step.stepOrder]}</p>
                  </div>
                  <StepStatusBadge status={step.status} />
                </button>
              ))}
            </div>

            {overrideStep !== null && (
              <div className="border-2 border-orange-300 rounded-xl p-4 space-y-3 bg-orange-50">
                <p className="font-semibold text-orange-800">
                  แก้ไขขั้นที่ {overrideStep}: {ROLE_LABELS[sub.workflowSteps[overrideStep - 1]?.role]}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOverrideAction("APPROVED")}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                      overrideAction === "APPROVED"
                        ? "bg-green-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >
                    บังคับอนุมัติ
                  </button>
                  <button
                    onClick={() => setOverrideAction("REJECTED")}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                      overrideAction === "REJECTED"
                        ? "bg-red-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >
                    บังคับปฏิเสธ
                  </button>
                </div>

                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="เหตุผล / หมายเหตุ (ไม่บังคับ)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleOverride}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition"
                  >
                    ยืนยันการแก้ไข
                  </button>
                  <button
                    onClick={() => setOverrideStep(null)}
                    className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Edit info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">ข้อมูลคำร้อง</h2>
              {!editMode ? (
                <button
                  onClick={() => { setEditMode(true); setEditTitle(sub.title); setEditAdvisor(sub.advisorId ?? ""); }}
                  className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  <Pencil className="w-4 h-4" />
                  แก้ไข
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditMode(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 mb-1">นักศึกษา</p>
                <p className="font-medium text-gray-800">{student?.name}</p>
                {student?.studentId && <p className="text-gray-400">{student.studentId}</p>}
              </div>
              <div>
                <p className="text-gray-500 mb-1">อาจารย์ที่ปรึกษา</p>
                {!editMode ? (
                  <p className="font-medium text-gray-800">{advisor?.name ?? "—"}</p>
                ) : (
                  <select
                    value={editAdvisor}
                    onChange={(e) => setEditAdvisor(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {advisors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Files */}
          {sub.uploads.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">เอกสารแนบ</h2>
              <ul className="space-y-3">
                {sub.uploads.map((u) => (
                  <li key={u.id} className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-700 leading-snug text-sm">{FORM_LABELS[u.formType]}</p>
                      <p className="text-xs text-gray-400">{u.fileName} · {formatBytes(u.fileSize)}</p>
                    </div>
                    <button
                      onClick={() => alert(`[Demo] ดาวน์โหลด: ${u.fileName}`)}
                      className="shrink-0 text-blue-500 hover:text-blue-700"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3">
            <h2 className="font-semibold text-red-700">ลบคำร้อง</h2>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition"
              >
                <Trash2 className="w-5 h-5" />
                ลบคำร้องนี้
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-medium text-center">ยืนยันการลบ? ไม่สามารถกู้คืนได้</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700">
                    ยืนยันลบ
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl">
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
