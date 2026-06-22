"use client";

import { useState, useRef } from "react";
import { FormType } from "@/types";
import { FORM_LABELS, formatBytes, cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { MockUpload } from "@/types";

interface Props {
  submissionId: string;
  formType: FormType;
  existingUpload?: MockUpload | null;
  onSuccess?: () => void;
}

export function FileUploader({ submissionId, formType, existingUpload, onSuccess }: Props) {
  const { refresh } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    if (file.type !== "application/pdf") { setError("รับเฉพาะไฟล์ PDF เท่านั้น"); return; }
    if (file.size > 20 * 1024 * 1024) { setError("ไฟล์ใหญ่เกิน 20 MB"); return; }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionId", submissionId);
      formData.append("formType", formType);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("upload failed");

      setFile(null);
      await refresh();
      onSuccess?.();
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setUploading(false);
    }
  }

  // Already has an uploaded file — show it with re-upload option
  if (existingUpload && !file) {
    return (
      <div className="border-2 border-green-200 rounded-xl p-4 space-y-3 bg-green-50">
        <p className="text-xs font-semibold text-gray-600">{FORM_LABELS[formType]}</p>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-800 truncate">{existingUpload.fileName}</p>
            <p className="text-xs text-green-600">{formatBytes(existingUpload.fileSize)}</p>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-white transition"
        >
          อัปโหลดไฟล์ใหม่แทน
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
        />
      </div>
    );
  }

  // No file yet — show uploader
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <p className="text-xs font-semibold text-gray-600">{FORM_LABELS[formType]}</p>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center gap-2 py-5 rounded-lg transition",
          uploading ? "bg-gray-50 cursor-wait" : "cursor-pointer hover:bg-gray-50"
        )}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
        ) : file ? (
          <FileText className="w-7 h-7 text-blue-400" />
        ) : (
          <Upload className="w-7 h-7 text-gray-300" />
        )}
        <span className="text-xs text-gray-500 text-center px-2">
          {uploading
            ? "กำลังอัปโหลด..."
            : file
            ? `${file.name} (${formatBytes(file.size)})`
            : "คลิกเพื่อเลือกไฟล์ PDF"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-40 hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
      >
        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
      </button>
    </div>
  );
}
