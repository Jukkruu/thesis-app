"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, XCircle, Upload, FileText } from "lucide-react";

interface Props {
  submissionId: string;
  label?: string;
}

export function SignatureButton({ submissionId, label = "อนุมัติ / ลงนาม" }: Props) {
  const { approveCurrentStep, rejectCurrentStep, addUpload } = useApp();
  const [notes, setNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-green-700 font-medium flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 shrink-0" />
        <p>ดำเนินการเรียบร้อยแล้ว<br /><span className="font-normal text-sm">กรุณารีเฟรชหน้าเพื่อดูสถานะล่าสุด</span></p>
      </div>
    );
  }

  function handleApprove() {
    if (!signedFile) {
      setError("กรุณาแนบเอกสารที่ลงนามแล้วก่อนอนุมัติ");
      return;
    }
    addUpload(submissionId, "SIGNED", signedFile.name, signedFile.size);
    approveCurrentStep(submissionId, notes || undefined);
    setDone(true);
  }

  function handleReject() {
    if (!notes.trim()) {
      setError("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }
    rejectCurrentStep(submissionId, notes);
    setDone(true);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">ดำเนินการ</h3>

      {/* Signed file upload — required for approve */}
      {!showReject && (
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            แนบเอกสารที่ลงนามแล้ว <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            {signedFile ? (
              <>
                <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-700 truncate">{signedFile.name}</p>
                  <p className="text-xs text-gray-400">คลิกเพื่อเปลี่ยนไฟล์</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600">คลิกเพื่อเลือกไฟล์ PDF</p>
                  <p className="text-xs text-gray-400">เอกสารที่ลงนามแล้ว</p>
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

      {/* Notes / reject reason */}
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
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!showReject ? (
          <>
            <button
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              {label}
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition"
            >
              <XCircle className="w-5 h-5" />
              ปฏิเสธ
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReject}
              className="flex-1 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
            >
              ยืนยันการปฏิเสธ
            </button>
            <button
              onClick={() => { setShowReject(false); setError(null); }}
              className="px-5 py-3.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition"
            >
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
