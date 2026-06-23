"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { CheckCircle2, XCircle, Upload, FileText, Loader2, Download, X } from "lucide-react";
import { FORM_LABELS, downloadFile, formatBytes } from "@/lib/utils";
import type { FormType } from "@/types";

interface ExtraSlot {
  slotKey: string;
  label: string;
  formType: string;
}

interface Props {
  submissionId: string;
  label?: string;
  onSuccess?: () => void;
  formsToShow?: string[];
  notePrefix?: string;
  requireNotePrefix?: boolean;
  extraSlots?: ExtraSlot[];
}

export function SignatureButton({ submissionId, label = "ส่งต่อ", onSuccess, formsToShow, notePrefix, requireNotePrefix, extraSlots }: Props) {
  const { approveCurrentStep, rejectCurrentStep, submissions } = useApp();
  const { showToast } = useToast();
  const [notes,      setNotes]      = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Per-form upload state
  const [fileByForm,      setFileByForm]      = useState<Record<string, File | null>>({});
  const [uploadingForm,   setUploadingForm]   = useState<string | null>(null);
  const [uploadedForms,   setUploadedForms]   = useState<Set<string>>(new Set());
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sub = submissions.find((s) => s.id === submissionId);

  // Determine which form slots to show for upload.
  // Non-SIGNED types upload with their own formType (versions the original file).
  // SIGNED or no formsToShow → single SIGNED slot.
  const nonSignedForms = (formsToShow ?? []).filter((f) => f !== "SIGNED");
  const baseTargets: string[] = nonSignedForms.length ? nonSignedForms : ["SIGNED"];
  const uploadTargets: string[] = [
    ...baseTargets,
    ...(extraSlots ?? []).map((s) => s.slotKey),
  ];
  const allFormsUploaded = uploadTargets.every((ft) => uploadedForms.has(ft));

  async function handleUploadForm(slotKey: string, file: File) {
    // Extra slots may have a different actual formType than their slot key
    const actualFormType = extraSlots?.find((s) => s.slotKey === slotKey)?.formType ?? slotKey;
    setUploadingForm(slotKey);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("submissionId", submissionId);
      fd.append("formType", actualFormType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      setUploadedForms((prev) => new Set([...prev, slotKey]));
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setUploadingForm(null);
    }
  }

  async function handleApprove() {
    if (requireNotePrefix && !notePrefix) {
      setError("กรุณาเลือกผลการสอบวิทยานิพนธ์ก่อน");
      return;
    }
    if (!allFormsUploaded) {
      setError("กรุณาอัปโหลดเอกสารที่ลงนามแล้วให้ครบก่อน");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const combinedNotes = [notePrefix, notes].filter(Boolean).join("\n") || undefined;
      await approveCurrentStep(submissionId, combinedNotes);
      showToast("อัปโหลดและอนุมัติเรียบร้อยแล้ว ✓");
      onSuccess?.();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!notes.trim()) { setError("กรุณาระบุเหตุผลในการปฏิเสธ"); return; }
    setLoading(true);
    setError(null);
    try {
      await rejectCurrentStep(submissionId, notes);
      showToast("บันทึกการปฏิเสธเรียบร้อยแล้ว", "error");
      onSuccess?.();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">ดำเนินการ</h3>

      {/* Step 1: Download forms to sign */}
      {!showReject && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">1</span>
            ดาวน์โหลดเอกสารเพื่อลงนาม
          </p>
          {(() => {
            const downloads = sub?.uploads
              ? (formsToShow?.length
                  ? sub.uploads.filter((u) => formsToShow.includes(u.formType))
                  : sub.uploads)
              : [];
            // Show only the latest version of each formType
            const latestByType = new Map<string, typeof downloads[0]>();
            for (const u of [...downloads].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())) {
              if (!latestByType.has(u.formType)) latestByType.set(u.formType, u);
            }
            const latestDownloads = [...latestByType.values()];
            return latestDownloads.length > 0 ? (
              <div className="space-y-2">
                {latestDownloads.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => downloadFile(u.id, u.fileName, FORM_LABELS[u.formType as FormType], sub?.title ?? "", u.fileUrl)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50 transition text-left"
                  >
                    <Download className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate">{FORM_LABELS[u.formType as FormType] ?? u.formType}</p>
                      <p className="text-xs text-gray-400 truncate">{u.fileName}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 text-center">
                ยังไม่มีเอกสารแนบ — นักศึกษายังไม่ได้อัปโหลดไฟล์
              </p>
            );
          })()}
        </div>
      )}

      {/* Step 2: Upload signed file(s) — one slot per upload target */}
      {!showReject && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">2</span>
            อัปโหลดเอกสารที่ลงนามแล้ว <span className="text-red-500">*</span>
          </p>

          {uploadTargets.map((ft) => {
            const isDone      = uploadedForms.has(ft);
            const isUploading = uploadingForm === ft;
            const selected    = fileByForm[ft] ?? null;
            const extraSlot   = extraSlots?.find((s) => s.slotKey === ft);
            const label       = extraSlot?.label ?? FORM_LABELS[ft as FormType] ?? ft;

            return (
              <div key={ft}>
                {uploadTargets.length > 1 && (
                  <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                )}

                {isDone ? (
                  <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm font-medium text-green-800">อัปโหลดสำเร็จแล้ว</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div
                      onClick={() => !isUploading && fileRefs.current[ft]?.click()}
                      className={cn(
                        "flex flex-col items-center gap-2 py-5 rounded-lg transition",
                        isUploading ? "bg-gray-50 cursor-wait" : "cursor-pointer hover:bg-gray-50"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                      ) : selected ? (
                        <FileText className="w-7 h-7 text-blue-400" />
                      ) : (
                        <Upload className="w-7 h-7 text-gray-300" />
                      )}
                      <span className="text-xs text-gray-500 text-center px-2">
                        {isUploading
                          ? "กำลังอัปโหลด..."
                          : selected
                          ? `${selected.name} (${formatBytes(selected.size)})`
                          : "คลิกเพื่อเลือกไฟล์ PDF (สูงสุด 20 MB)"}
                      </span>
                    </div>
                    {selected && !isUploading && (
                      <button
                        onClick={() => { setFileByForm((prev) => ({ ...prev, [ft]: null })); if (fileRefs.current[ft]) fileRefs.current[ft]!.value = ""; }}
                        className="w-full py-1.5 rounded-lg border border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> เลือกไฟล์ใหม่
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={(el) => { fileRefs.current[ft] = el; }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFileByForm((prev) => ({ ...prev, [ft]: f }));
                    setError(null);
                  }}
                />

                {selected && !isDone && !isUploading && (
                  <button
                    onClick={() => handleUploadForm(ft, selected)}
                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    อัปโหลด{uploadTargets.length > 1 ? ` ${label}` : ""}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">
          {showReject ? "เหตุผลในการปฏิเสธ *" : "หมายเหตุ (ไม่บังคับ)"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setError(null); }}
          placeholder={showReject ? "ระบุเหตุผล..." : "หมายเหตุเพิ่มเติม..."}
          className="w-full border border-gray-200 rounded-xl p-3 text-base resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {!showReject ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? "กำลังบันทึก..." : label}
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-60 transition"
            >
              <XCircle className="w-5 h-5" />
              ปฏิเสธ
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? "กำลังบันทึก..." : "ยืนยันการปฏิเสธ"}
            </button>
            <button
              onClick={() => { setShowReject(false); setError(null); }}
              disabled={loading}
              className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-60 transition"
            >
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
