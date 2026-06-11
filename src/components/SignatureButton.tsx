"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { CheckCircle2, XCircle, Upload, FileText, Loader2, Download } from "lucide-react";
import { FORM_LABELS, downloadFile } from "@/lib/utils";

interface Props {
  submissionId: string;
  label?: string;
  onSuccess?: () => void;
}

export function SignatureButton({ submissionId, label = "อัปโหลด", onSuccess }: Props) {
  const { approveCurrentStep, rejectCurrentStep, submissions } = useApp();
  const { showToast } = useToast();
  const [notes,      setNotes]      = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sub = submissions.find((s) => s.id === submissionId);

  async function handleApprove() {
    if (!signedFile) { setError("กรุณาแนบเอกสารที่ลงนามแล้วก่อนอัปโหลด"); return; }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", signedFile);
      formData.append("submissionId", submissionId);
      formData.append("formType", "SIGNED");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("upload failed");
      await approveCurrentStep(submissionId, notes || undefined);
      showToast("อัปโหลดและอนุมัติเรียบร้อยแล้ว ✓");
      onSuccess?.();
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
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
          {sub?.uploads && sub.uploads.length > 0 ? (
            <div className="space-y-2">
              {sub.uploads.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => downloadFile(u.id, u.fileName, FORM_LABELS[u.formType], sub.title, u.fileUrl)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50 transition text-left"
                >
                  <Download className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{FORM_LABELS[u.formType]}</p>
                    <p className="text-xs text-gray-400 truncate">{u.fileName}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 text-center">
              ยังไม่มีเอกสารแนบ — นักศึกษายังไม่ได้อัปโหลดไฟล์
            </p>
          )}
        </div>
      )}

      {/* Step 2: Upload signed file */}
      {!showReject && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">2</span>
            อัปโหลดเอกสารที่ลงนามแล้ว <span className="text-red-500">*</span>
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition",
              signedFile
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
            )}
          >
            {signedFile ? (
              <>
                <FileText className="w-6 h-6 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-green-700 truncate">{signedFile.name}</p>
                  <p className="text-xs text-green-600">เลือกแล้ว — คลิกเพื่อเปลี่ยน</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400 shrink-0" />
                <div>
                  <p className="font-medium text-gray-600">คลิกเพื่อเลือกไฟล์ PDF</p>
                  <p className="text-sm text-gray-400">เอกสารที่ลงนามแล้วเท่านั้น</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { setSignedFile(e.target.files?.[0] ?? null); setError(null); }}
          />
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
