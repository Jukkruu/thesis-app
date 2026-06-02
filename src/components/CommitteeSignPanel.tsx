"use client";

import { useState } from "react";
import { useApp, MOCK_USERS } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { MockWorkflowStep } from "@/types";
import { CheckCircle2, XCircle, Clock, Loader2, Users } from "lucide-react";

interface Props {
  submissionId: string;
  step: MockWorkflowStep;
  onSuccess?: () => void;
}

export function CommitteeSignPanel({ submissionId, step, onSuccess }: Props) {
  const { user, committeeSign } = useApp();
  const { showToast } = useToast();
  const [notes, setNotes]       = useState("");
  const [showReject, setReject] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const members = step.committeeMembers ?? [];
  const actions = step.committeeActions ?? [];
  const approvedCount = actions.filter((a) => a.decision === "APPROVED").length;
  const myAction = actions.find((a) => a.userId === user?.id);
  const iAmMember = user ? members.includes(user.id) : false;

  async function act(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !notes.trim()) {
      setError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    committeeSign(submissionId, decision, notes || undefined);
    setLoading(false);
    showToast(decision === "APPROVED" ? "ลงนามเรียบร้อยแล้ว ✓" : "บันทึกการไม่อนุมัติแล้ว", decision === "APPROVED" ? "success" : "error");
    onSuccess?.();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        คณะกรรมการสอบ
      </h3>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${members.length ? (approvedCount / members.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 shrink-0">
          ลงนาม {approvedCount}/{members.length}
        </span>
      </div>

      {/* Member roster */}
      <ul className="space-y-2">
        {members.map((mid) => {
          const m = MOCK_USERS.find((u) => u.id === mid);
          const a = actions.find((x) => x.userId === mid);
          return (
            <li key={mid} className="flex items-center gap-2.5 text-sm">
              {a?.decision === "APPROVED" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : a?.decision === "REJECTED" ? (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-gray-300 shrink-0" />
              )}
              <span className={`flex-1 ${a ? "text-gray-700" : "text-gray-400"}`}>
                {m?.name ?? mid}
                {mid === user?.id && <span className="text-blue-500"> (ท่าน)</span>}
              </span>
              {a && (
                <span className={`text-xs font-medium ${a.decision === "APPROVED" ? "text-green-600" : "text-red-500"}`}>
                  {a.decision === "APPROVED" ? "ลงนามแล้ว" : "ไม่อนุมัติ"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* This member's action area */}
      {!iAmMember ? (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 text-center">
          ท่านไม่ได้เป็นกรรมการสอบของวิทยานิพนธ์นี้
        </p>
      ) : myAction ? (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${myAction.decision === "APPROVED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {myAction.decision === "APPROVED"
            ? "✓ ท่านลงนามแล้ว — รอกรรมการท่านอื่นลงนามให้ครบ"
            : "ท่านไม่อนุมัติวิทยานิพนธ์นี้"}
        </div>
      ) : (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">ความเห็นของท่าน</p>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setError(null); }}
            placeholder={showReject ? "เหตุผลในการไม่อนุมัติ *" : "หมายเหตุ (ไม่บังคับ)"}
            className="w-full border border-gray-200 rounded-xl p-3 text-base resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            {!showReject ? (
              <>
                <button
                  onClick={() => act("APPROVED")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  ลงนามอนุมัติ
                </button>
                <button
                  onClick={() => setReject(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-60 transition"
                >
                  <XCircle className="w-5 h-5" />
                  ไม่อนุมัติ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => act("REJECTED")}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {loading ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
                </button>
                <button
                  onClick={() => { setReject(false); setError(null); }}
                  disabled={loading}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                >
                  ยกเลิก
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">
            วิทยานิพนธ์จะผ่านขั้นนี้เมื่อกรรมการครบทุกท่านลงนามอนุมัติ
          </p>
        </div>
      )}
    </div>
  );
}
