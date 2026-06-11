"use client";

import { useState, useRef } from "react";
import { FormType } from "@/types";
import { FORM_LABELS, formatBytes, cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props {
  submissionId: string;
  formType: FormType;
  onSuccess?: () => void;
}

export function FileUploader({ submissionId, formType, onSuccess }: Props) {
  const { refresh } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
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

      await refresh();
      setDone(true);
      onSuccess?.();
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <p className="text-xs font-semibold text-gray-600">{FORM_LABELS[formType]}</p>

      <div
        onClick={() => !done && !uploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center gap-2 py-5 rounded-lg transition",
          done ? "bg-green-50 cursor-default" : uploading ? "bg-gray-50 cursor-wait" : "cursor-pointer hover:bg-gray-50"
        )}
      >
        {done ? (
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        ) : uploading ? (
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
        ) : file ? (
          <FileText className="w-7 h-7 text-blue-400" />
        ) : (
          <Upload className="w-7 h-7 text-gray-300" />
        )}
        <span className="text-xs text-gray-500 text-center px-2">
          {done
            ? "อัปโหลดสำเร็จแล้ว"
            : uploading
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
        onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDone(false); setError(null); }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!done && (
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-40 hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
        >
          {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
        </button>
      )}
    </div>
  );
}
