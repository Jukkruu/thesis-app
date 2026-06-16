"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { SignatureButton } from "./SignatureButton";
import { CommitteeSignPanel } from "./CommitteeSignPanel";
import { SubmissionStatusBadge } from "./StatusBadge";
import { FileList } from "./FileList";
import { ROLE_LABELS, formatDate, PROGRAM_LABELS } from "@/lib/utils";
import { ArrowLeft, Clock, AlertCircle, StickyNote, CalendarDays } from "lucide-react";
import Link from "next/link";

interface Props {
  submissionId: string;
  backPath: string;
}

export function RoleSubmissionDetail({ submissionId, backPath }: Props) {
  const { user, submissions, users } = useApp();
  const router = useRouter();
  const sub = submissions.find((s) => s.id === submissionId);

  if (!sub) {
    return (
      <div className="text-center py-20 text-gray-400 space-y-3">
        <p className="text-lg">ไม่พบข้อมูลคำร้อง</p>
        <Link href={backPath} className="text-blue-500 hover:underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const allUsers    = users;
  const student     = allUsers.find((u) => u.id === sub.studentId);
  const advisor     = allUsers.find((u) => u.id === sub.advisorId);
  const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
  const isMyTurn    = currentStep?.role === user?.role;

  // Which form types the current role needs to download and physically sign
  const STEP_SIGN_FORMS: Record<string, Record<number, string[]>> = {
    PROPOSAL: {
      2: ["BW1A", "BW1B"],
      3: ["BW1A"],
      5: ["B1C"],
      6: ["B1C"],
      7: ["B1C"],
      8: ["B1C", "B1D"],
      9: ["B1C", "B1D"],
    },
    THESIS_DEFENSE: {
      2: ["B3"],         // EXAM_COMMITTEE signs B3
      3: ["B3"],         // ADVISOR signs B3
      4: ["B2"],         // HEAD_EXAM_COMMITTEE — verify with user
      5: ["B2"],         // PROGRAM_CHAIR — verify with user
      6: ["B2", "B3"],   // ADMIN relay to Faculty (needs both)
      8: ["SIGNED"],
      9: ["SIGNED"],
      10: ["SIGNED"],    // EXAM_COMMITTEE post-defense
      11: ["SIGNED"],
      12: ["SIGNED"],
      14: ["B4"],
      15: ["THESIS"],
      16: ["THESIS"],
      17: ["THESIS"],    // EXAM_COMMITTEE thesis cover
      18: ["THESIS"],
    },
  };
  const formsToShow = currentStep
    ? (STEP_SIGN_FORMS[sub.submissionType ?? "PROPOSAL"]?.[currentStep.stepOrder] ?? [])
    : [];
  const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
  const totalSteps  = sub.workflowSteps.length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link href={backPath} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium">
        <ArrowLeft className="w-5 h-5" />
        ย้อนกลับรายการ
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{sub.title}</h1>
          <p className="text-gray-500">
            นักศึกษา: <span className="font-medium text-gray-700">{sub.studentFullName ?? student?.name}</span>
            {(sub.studentCode ?? student?.studentId) && (
              <span className="text-gray-400"> ({sub.studentCode ?? student?.studentId})</span>
            )}
          </p>
          {advisor && (
            <p className="text-gray-500 text-sm">
              อาจารย์ที่ปรึกษา: <span className="text-gray-700">{advisor.name}</span>
            </p>
          )}
          <p className="text-sm text-gray-400">{formatDate(sub.createdAt)}</p>
        </div>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      {/* Exam / committee info */}
      {(sub.examDate || sub.program || sub.studentPhone) && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">ข้อมูลการสอบ</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {sub.program && <InfoRow label="หลักสูตร" value={PROGRAM_LABELS[sub.program] ?? sub.program} />}
            {sub.studentPhone && <InfoRow label="เบอร์โทร" value={sub.studentPhone} />}
            {sub.studentEmail && <InfoRow label="อีเมลนิสิต" value={sub.studentEmail} />}
            {sub.examDate && (
              <InfoRow label="วันที่สอบ" value={`${sub.examDate}${sub.examTime ? ` เวลา ${sub.examTime} น.` : ""}`} icon={<CalendarDays className="w-4 h-4 text-blue-400" />} />
            )}
            {sub.roomNeeded && <InfoRow label="ห้องประชุม" value="ต้องการ" />}
            {sub.parkingNeeded && sub.carPlate && <InfoRow label="ที่จอดรถ (ทะเบียน)" value={sub.carPlate} />}
            {sub.headCommitteeId && <InfoRow label="ประธานกรรมการสอบ" value={allUsers.find((u) => u.id === sub.headCommitteeId)?.name ?? sub.headCommitteeId} />}
            {sub.committeeIds && sub.committeeIds.length > 0 && (
              <InfoRow
                label="กรรมการสอบ"
                value={sub.committeeIds
                  .map((uid: string) => allUsers.find((u) => u.id === uid)?.name ?? uid)
                  .join(", ")}
              />
            )}
            {(sub.invitedProfName || sub.invitedCommitteeId) && (
              <InfoRow
                label="กรรมการภายนอก"
                value={sub.invitedProfName ?? allUsers.find((u) => u.id === sub.invitedCommitteeId)?.name ?? sub.invitedCommitteeId ?? ""}
              />
            )}
            {sub.invitedProfAffiliation && <InfoRow label="สังกัดกรรมการภายนอก" value={sub.invitedProfAffiliation} />}
            {sub.invitedProfEmail && <InfoRow label="อีเมลกรรมการภายนอก" value={sub.invitedProfEmail} />}
            {sub.invitedProfPhone && <InfoRow label="เบอร์โทรกรรมการภายนอก" value={sub.invitedProfPhone} />}
          </div>
        </div>
      )}

      {/* Admin note */}
      {sub.adminNote && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
          <StickyNote className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">บันทึกจากผู้ดูแลระบบ</p>
            <p className="text-yellow-800 text-sm">{sub.adminNote}</p>
          </div>
        </div>
      )}

      {/* "Your turn" banner */}
      {isMyTurn && sub.status === "IN_PROGRESS" && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-300 rounded-2xl px-5 py-4">
          <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">ถึงคิวของท่านแล้ว</p>
            <p className="text-sm text-blue-600">
              กรุณาตรวจสอบเอกสาร แล้วลงนามหรือปฏิเสธด้านล่าง
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 shrink-0">
          {doneCount}/{totalSteps} ขั้นตอน
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline — second on mobile so the action panel is reachable first */}
        <div className="order-2 lg:order-none lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">ขั้นตอนทั้งหมด</h2>
          <WorkflowTimeline steps={sub.workflowSteps} users={allUsers} submissionType={sub.submissionType} />
        </div>

        {/* Sidebar — first on mobile */}
        <div className="order-1 lg:order-none space-y-4">
          {/* Documents — grouped by form type, latest first */}
          {sub.uploads.length > 0 && (
            <FileList uploads={sub.uploads} submissionTitle={sub.title} />
          )}

          {/* Action — committee step uses multi-member panel */}
          {isMyTurn && !["COMPLETED", "CANCELLED"].includes(sub.status) && currentStep?.role === "EXAM_COMMITTEE" && (
            <CommitteeSignPanel
              submissionId={sub.id}
              step={currentStep}
              formsToShow={formsToShow}
              onSuccess={() => router.push(backPath)}
            />
          )}

          {isMyTurn && !["COMPLETED", "CANCELLED"].includes(sub.status) && currentStep?.role !== "EXAM_COMMITTEE" && (
            <SignatureButton
              submissionId={sub.id}
              formsToShow={formsToShow}
              onSuccess={() => router.push(backPath)}
            />
          )}

          {!isMyTurn && currentStep && !["COMPLETED", "CANCELLED"].includes(sub.status) && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
                <Clock className="w-5 h-5" />
                รอดำเนินการจาก
              </div>
              <p className="text-orange-600 font-medium">{ROLE_LABELS[currentStep.role]}</p>
              <p className="text-sm text-orange-500 mt-1">ขั้นที่ {currentStep.stepOrder} จาก {totalSteps}</p>
            </div>
          )}

          {sub.status === "COMPLETED" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-1">
              <p className="text-2xl">✅</p>
              <p className="text-green-800 font-semibold text-lg">อนุมัติครบทุกขั้นตอน</p>
              <p className="text-green-600 text-sm">วิทยานิพนธ์ผ่านการพิจารณาแล้ว</p>
            </div>
          )}

          {sub.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-1">
              <p className="text-2xl">❌</p>
              <p className="text-red-800 font-semibold text-lg">คำร้องถูกปฏิเสธ</p>
              <p className="text-red-600 text-sm">โปรดดูหมายเหตุในขั้นตอนที่ปฏิเสธ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon ?? <span className="w-4 h-4 shrink-0" />}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
