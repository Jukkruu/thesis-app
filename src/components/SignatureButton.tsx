"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  submissionId: string;
  label?: string;
}

export function SignatureButton({ submissionId, label = "อนุมัติ / ลงนาม" }: Props) {
  const { approveCurrentStep, rejectCurrentStep } = useApp();
  const [notes, setNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        ดำเนินการเรียบร้อยแล้ว — กรุณารีเฟรชหน้าเพื่อดูสถานะใหม่
      </div>
    );
  }

  function handleApprove() {
    approveCurrentStep(submissionId, notes || undefined);
    setDone(true);
  }

  function handleReject() {
    if (!notes.trim()) { setError("กรุณาระบุเหตุผล"); return; }
    rejectCurrentStep(submissionId, notes);
    setDone(true);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">ดำเนินการ</h3>

      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setError(null); }}
        placeholder={showReject ? "ระบุเหตุผลในการปฏิเสธ *" : "หมายเหตุเพิ่มเติม (ไม่บังคับ)"}
        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        {!showReject ? (
          <>
            <button
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {label}
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition"
            >
              <XCircle className="w-4 h-4" />
              ปฏิเสธ
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReject}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              ยืนยันการปฏิเสธ
            </button>
            <button
              onClick={() => { setShowReject(false); setError(null); }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition"
            >
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
