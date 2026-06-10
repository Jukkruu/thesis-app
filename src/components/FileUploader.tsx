"use client";

import { useState, useRef } from "react";
import { FormType } from "@/types";
import { FORM_LABELS, formatBytes, cn } from "@/lib/utils";
import { readAsDataUrl } from "@/lib/fileStore";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props {
  submissionId: string;
  formType: FormType;
  onSuccess?: () => void;
}

export function FileUploader({ submissionId, formType, onSuccess }: Props) {
  const { addUpload } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    if (file.type !== "application/pdf") { setError("รับเฉพาะไฟล์ PDF เท่านั้น"); return; }
    if (file.size > 20 * 1024 * 1024) { setError("ไฟล์ใหญ่เกิน 20 MB"); return; }
    const dataUrl = await readAsDataUrl(file);
    addUpload(submissionId, formType, file.name, file.size, dataUrl);
    setDone(true);
    setError(null);
    onSuccess?.();
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <p className="text-xs font-semibold text-gray-600">{FORM_LABELS[formType]}</p>

      <div
        onClick={() => !done && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center gap-2 py-5 rounded-lg cursor-pointer transition",
          done ? "bg-green-50 cursor-default" : "hover:bg-gray-50"
        )}
      >
        {done ? (
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        ) : file ? (
          <FileText className="w-7 h-7 text-blue-400" />
        ) : (
          <Upload className="w-7 h-7 text-gray-300" />
        )}
        <span className="text-xs text-gray-500 text-center px-2">
          {done
            ? "อัปโหลดสำเร็จแล้ว"
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
          disabled={!file}
          className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium disabled:opacity-40 hover:bg-blue-700 transition"
        >
          อัปโหลด
        </button>
      )}
    </div>
  );
}
