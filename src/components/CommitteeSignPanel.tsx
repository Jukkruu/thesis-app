"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { MockWorkflowStep } from "@/types";
import { CheckCircle2, XCircle, Clock, Loader2, Users, Upload, FileText, Download } from "lucide-react";
import { FORM_LABELS, downloadFile } from "@/lib/utils";
import { readAsDataUrl } from "@/lib/fileStore";

interface Props {
  submissionId: string;
  step: MockWorkflowStep;
  onSuccess?: () => void;
}

export function CommitteeSignPanel({ submissionId, step, onSuccess }: Props) {
  const { user, users, submissions, committeeSign, addUpload } = useApp();
  const { showToast } = useToast();
  const [notes,      setNotes]      = useState("");
  const [showReject, setReject]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sub     = submissions.find((s) => s.id === submissionId);
  const members = step.committeeMembers ?? [];
  const actions = step.committeeActions ?? [];
  const approvedCount = actions.filter((a) => a.decision === "APPROVED").length;
  const myAction  = actions.find((a) => a.userId === user?.id);
  const iAmMember = user ? members.includes(user.id) : false;

  async function act(decision: "APPROVED" | "REJECTED") {
    if (decision === "APPROVED" && !signedFile) {
      setError("กรุณาแนบเอกสารที่ลงนามแล้วก่อนอัปโหลด");
      return;
    }
    if (decision === "REJECTED" && !notes.trim()) {
      setError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }
    setLoading(true);
    if (decision === "APPROVED" && signedFile) {
      const dataUrl = await readAsDataUrl(signedFile);
      addUpload(submissionId, "SIGNED", signedFile.name, signedFile.size, dataUrl);
    }
    await new Promise((r) => setTimeout(r, 500));
    committeeSign(submissionId, decision, notes || undefined);
    setLoading(false);
    showToast(
      decision === "APPROVED" ? "อัปโหลดและลงนามเรียบร้อยแล้ว ✓" : "บันทึกการไม่อนุมัติแล้ว",
      decision === "APPROVED" ? "success" : "error"
    );
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
          const m = users.find((u) => u.id === mid);
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
                  {a.decision === "APPROVED" ? "อัปโหลดแล้ว" : "ไม่อนุมัติ"}
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
            ? "✓ ท่านอัปโหลดแล้ว — รอกรรมการท่านอื่นลงนามให้ครบ"
            : "ท่านไม่อนุมัติวิทยานิพนธ์นี้"}
        </div>
      ) : (
        <div className="space-y-4 pt-1 border-t border-gray-100">

          {/* Step 1: Download */}
          {!showReject && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mr-1.5">1</span>
                ดาวน์โหลดเอกสารเพื่อลงนาม
              </p>
              {sub?.uploads && sub.uploads.length > 0 ? (
                <div className="space-y-1.5">
                  {sub.uploads.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => downloadFile(u.id, u.fileName, FORM_LABELS[u.formType], sub.title)}
                      className="w-full flex items-center gap-3 px-3 py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition text-left"
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
                  "flex items-center gap-3 p-3.5 border-2 border-dashed rounded-xl cursor-pointer transition",
                  signedFile
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                )}
              >
                {signedFile ? (
                  <>
                    <FileText className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-700 truncate">{signedFile.name}</p>
                      <p className="text-xs text-green-600">เลือกแล้ว — คลิกเพื่อเปลี่ยน</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">คลิกเพื่อเลือกไฟล์ PDF</p>
                      <p className="text-xs text-gray-400">เอกสารที่ลงนามแล้วเท่านั้น</p>
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
                  {loading ? "กำลังบันทึก..." : "อัปโหลด"}
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
            วิทยานิพนธ์จะผ่านขั้นนี้เมื่อกรรมการครบทุกท่านอัปโหลดแล้ว
          </p>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
