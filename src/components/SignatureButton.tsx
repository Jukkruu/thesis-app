"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { CheckCircle2, XCircle, Upload, FileText, Loader2, Download } from "lucide-react";
import { FORM_LABELS, downloadFile } from "@/lib/utils";
import type { FormType } from "@/types";

interface Props {
  submissionId: string;
  label?: string;
  onSuccess?: () => void;
  formsToShow?: string[];
}

export function SignatureButton({ submissionId, label = "อัปโหลด", onSuccess, formsToShow }: Props) {
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
  const uploadTargets: string[] = nonSignedForms.length ? nonSignedForms : ["SIGNED"];
  const allFormsUploaded = uploadTargets.every((ft) => uploadedForms.has(ft));

  async function handleUploadForm(formType: string, file: File) {
    setUploadingForm(formType);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("submissionId", submissionId);
      fd.append("formType", formType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      setUploadedForms((prev) => new Set([...prev, formType]));
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setUploadingForm(null);
    }
  }

  async function handleApprove() {
    if (!allFormsUploaded) {
      setError("กรุณาอัปโหลดเอกสารที่ลงนามแล้วให้ครบก่อน");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await approveCurrentStep(submissionId, notes || undefined);
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
    await new Promise((r) => setTimeout(r, 400));
    rejectCurrentStep(submissionId, notes);
    setLoading(false);
    showToast("บันทึกการปฏิเสธเรียบร้อยแล้ว", "error");
    onSuccess?.();
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
            const label       = FORM_LABELS[ft as FormType] ?? ft;

            return (
              <div key={ft}>
                {uploadTargets.length > 1 && (
                  <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                )}

                <div
                  onClick={() => !isDone && !isUploading && fileRefs.current[ft]?.click()}
                  className={cn(
                    "flex items-center gap-3 p-4 border-2 border-dashed rounded-xl transition",
                    isDone
                      ? "border-green-300 bg-green-50 cursor-default"
                      : selected
                      ? "border-blue-300 bg-blue-50 cursor-pointer"
                      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : isUploading ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                  ) : selected ? (
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <Upload className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    {isDone ? (
                      <p className="text-sm font-medium text-green-700">อัปโหลดสำเร็จแล้ว</p>
                    ) : isUploading ? (
                      <p className="text-sm text-blue-600">กำลังอัปโหลด...</p>
                    ) : selected ? (
                      <>
                        <p className="text-sm font-medium text-gray-700 truncate">{selected.name}</p>
                        <p className="text-xs text-gray-400">คลิกเพื่อเปลี่ยน</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-600">คลิกเพื่อเลือกไฟล์ PDF</p>
                        <p className="text-xs text-gray-400">เอกสารที่ลงนามแล้วเท่านั้น</p>
                      </>
                    )}
                  </div>
                </div>

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

                {/* Upload button shown when a file is selected and not yet uploaded */}
                {selected && !isDone && !isUploading && (
                  <button
                    onClick={() => handleUploadForm(ft, selected)}
                    className="mt-2 w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
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
