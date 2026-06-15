"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ROLE_LABELS, getStepName, formatDate, PROGRAM_LABELS } from "@/lib/utils";
import { SubmissionStatus } from "@/types";
import Link from "next/link";
import {
  ChevronRight, Clock, CheckCircle2, XCircle, FileText,
  Trash2, Search, AlertCircle, Bell, ArrowUpDown,
  Flame, GraduationCap, BookOpen,
} from "lucide-react";
import type { MockSubmission, MockWorkflowStep } from "@/types";

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function getStuckDays(sub: MockSubmission): number {
  if (sub.status !== "IN_PROGRESS") return 0;
  const last = sub.workflowSteps
    .filter((s) => s.actedAt)
    .sort((a, b) => new Date(b.actedAt!).getTime() - new Date(a.actedAt!).getTime())[0];
  return last?.actedAt ? daysSince(last.actedAt) : daysSince(sub.createdAt);
}

function resolvePendingInfo(
  sub: MockSubmission,
  step: MockWorkflowStep,
  users: { id: string; name: string; role: string }[],
): { label: string; detail: string | null } {
  const label = ROLE_LABELS[step.role];
  switch (step.role) {
    case "ADVISOR": {
      const u = users.find((u) => u.id === sub.advisorId);
      return { label, detail: u?.name ?? null };
    }
    case "HEAD_EXAM_COMMITTEE": {
      const u = users.find((u) => u.id === sub.headCommitteeId);
      return { label, detail: u?.name ?? null };
    }
    case "EXAM_COMMITTEE": {
      const memberIds: string[] = step.committeeMembers?.length
        ? step.committeeMembers : (sub.committeeIds ?? []);
      const signedIds = new Set((step.committeeActions ?? []).map((a) => a.userId));
      const pending = memberIds.filter((id) => !signedIds.has(id));
      const names = pending.map((id) => users.find((u) => u.id === id)?.name ?? id).filter(Boolean);
      return { label, detail: names.length ? `รอ ${names.length}/${memberIds.length}: ${names.join(", ")}` : null };
    }
    case "INVITED_EXAM_COMMITTEE": {
      const u = users.find((u) => u.id === sub.invitedCommitteeId);
      return { label, detail: u?.name ?? sub.invitedProfName ?? null };
    }
    case "PROGRAM_CHAIR": {
      const u = users.find((u) => u.role === "PROGRAM_CHAIR");
      return { label, detail: u?.name ?? null };
    }
    default:
      return { label, detail: null };
  }
}

const STATUS_TABS: { label: string; value: SubmissionStatus | "ALL" }[] = [
  { label: "ทั้งหมด",         value: "ALL" },
  { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
  { label: "เสร็จสิ้น",      value: "COMPLETED" },
  { label: "ถูกปฏิเสธ",      value: "REJECTED" },
];

const TYPE_TABS = [
  { label: "ทุกประเภท",     value: "ALL" },
  { label: "เสนอหัวข้อ",    value: "PROPOSAL" },
  { label: "สอบวิทยานิพนธ์", value: "THESIS_DEFENSE" },
] as const;

const SORT_OPTIONS = [
  { label: "ค้างนานที่สุด", value: "stuck" },
  { label: "ใหม่ล่าสุด",   value: "newest" },
  { label: "เก่าที่สุด",   value: "oldest" },
] as const;

export default function AdminDashboard() {
  const { submissions, adminDeleteSubmission, user, users } = useApp();

  const myPending = submissions.filter((s) => {
    const step = s.workflowSteps.find((w) => w.status === "PENDING");
    return step?.role === "ADMIN";
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState<SubmissionStatus | "ALL">("ALL");
  const [typeFilter,   setTypeFilter]     = useState<"ALL" | "PROPOSAL" | "THESIS_DEFENSE">("ALL");
  const [sortBy,       setSortBy]         = useState<"stuck" | "newest" | "oldest">("stuck");
  const [search,       setSearch]         = useState("");

  const counts = useMemo(() => ({
    ALL:           submissions.length,
    IN_PROGRESS:   submissions.filter((s) => s.status === "IN_PROGRESS").length,
    COMPLETED:     submissions.filter((s) => s.status === "COMPLETED").length,
    REJECTED:      submissions.filter((s) => s.status === "REJECTED").length,
    PROPOSAL:      submissions.filter((s) => s.submissionType === "PROPOSAL").length,
    THESIS_DEFENSE:submissions.filter((s) => s.submissionType === "THESIS_DEFENSE").length,
  }), [submissions]);

  // Stage distribution (in-progress only)
  const stageData = useMemo(() => {
    const groups = new Map<string, { key: string; name: string; count: number; type: string }>();
    for (const s of submissions) {
      if (s.status !== "IN_PROGRESS") continue;
      const cur = s.workflowSteps.find((w) => w.status === "PENDING");
      if (!cur) continue;
      const subType = s.submissionType ?? "PROPOSAL";
      const key     = `${subType}_${String(cur.stepOrder).padStart(2, "0")}`;
      const name    = getStepName(cur.stepOrder, s.submissionType) || `ขั้นที่ ${cur.stepOrder}`;
      const prev    = groups.get(key);
      groups.set(key, { key, name, count: (prev?.count ?? 0) + 1, type: subType });
    }
    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [submissions]);
  const maxStage = Math.max(1, ...stageData.map((d) => d.count));

  // Stuck submissions (>7 days without action)
  const stuckSubs = useMemo(
    () => submissions.filter((s) => getStuckDays(s) > 7)
                     .sort((a, b) => getStuckDays(b) - getStuckDays(a)),
    [submissions],
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return submissions
      .filter((sub) => {
        if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
        if (typeFilter   !== "ALL" && sub.submissionType !== typeFilter) return false;
        if (query) {
          const student = users.find((u) => u.id === sub.studentId);
          const match =
            sub.title.toLowerCase().includes(query)
            || (student?.name ?? "").toLowerCase().includes(query)
            || (student?.studentId ?? "").toLowerCase().includes(query);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return getStuckDays(b) - getStuckDays(a);
      });
  }, [submissions, statusFilter, typeFilter, search, sortBy, users]);

  const getStudent = (id: string) => users.find((u) => u.id === id);

  return (
    <div className="max-w-5xl space-y-6">
      <DashboardHeader
        role="ADMIN"
        name={user?.name ?? "ผู้ดูแลระบบ"}
        title="ภาพรวมคำร้อง"
        highlight={{ label: "กำลังดำเนินการ", value: counts.IN_PROGRESS }}
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<FileText className="w-5 h-5 text-gray-500" />}
          label="ทั้งหมด" value={counts.ALL}
          sub={`เสนอหัวข้อ ${counts.PROPOSAL} · สอบ ${counts.THESIS_DEFENSE}`}
          color="bg-gray-50 border-gray-200"
        />
        <KpiCard
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          label="กำลังดำเนินการ" value={counts.IN_PROGRESS}
          sub={stuckSubs.length > 0 ? `ค้าง >7 วัน: ${stuckSubs.length} รายการ` : "ไม่มีรายการค้าง"}
          subColor={stuckSubs.length > 0 ? "text-amber-600" : "text-green-600"}
          color="bg-blue-50 border-blue-200"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="เสร็จสิ้น" value={counts.COMPLETED}
          sub={counts.ALL > 0 ? `${Math.round((counts.COMPLETED / counts.ALL) * 100)}% ของทั้งหมด` : ""}
          color="bg-green-50 border-green-200"
        />
        <KpiCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          label="ถูกปฏิเสธ" value={counts.REJECTED}
          sub={counts.ALL > 0 ? `${Math.round((counts.REJECTED / counts.ALL) * 100)}% ของทั้งหมด` : ""}
          color="bg-red-50 border-red-200"
        />
      </div>

      {/* ── Stuck alert ── */}
      {stuckSubs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-amber-800 text-lg">
              ค้างดำเนินการ &gt;7 วัน ({stuckSubs.length} รายการ)
            </h2>
          </div>
          <div className="space-y-2">
            {stuckSubs.map((sub) => {
              const student     = users.find((u) => u.id === sub.studentId);
              const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
              const days        = getStuckDays(sub);
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {student?.name}
                      {currentStep && (
                        <span className="text-amber-600 font-medium"> · รอ {ROLE_LABELS[currentStep.role]}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                      {days} วัน
                    </span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My pending approvals ── */}
      {myPending.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-orange-800 text-lg">
              รออนุมัติจากท่าน ({myPending.length} รายการ)
            </h2>
          </div>
          <div className="space-y-2">
            {myPending.map((sub) => {
              const student = users.find((u) => u.id === sub.studentId);
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/${sub.id}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-orange-200 hover:border-orange-400 hover:shadow-sm transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={sub.submissionType} />
                      <p className="font-semibold text-gray-900 truncate">{sub.title}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {student?.name}
                      {student?.studentId && <span className="text-gray-400"> ({student.studentId})</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">ตรวจรับ</span>
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stage pipeline ── */}
      {stageData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">กำลังรออยู่ที่ขั้นไหน</h2>
            <span className="text-xs text-gray-400">เฉพาะรายการกำลังดำเนินการ</span>
          </div>
          <div className="space-y-2">
            {stageData.map((d, i) => {
              const isMax = d.count === maxStage && d.count > 1;
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-52 shrink-0 justify-end">
                    {d.type === "PROPOSAL"
                      ? <BookOpen className="w-3 h-3 text-violet-400 shrink-0" />
                      : <GraduationCap className="w-3 h-3 text-teal-400 shrink-0" />}
                    <span className="text-sm text-gray-600 truncate text-right">{d.name}</span>
                  </div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMax ? "bg-amber-400" : d.type === "PROPOSAL" ? "bg-violet-400" : "bg-teal-400"
                      }`}
                      style={{ width: `${Math.max((d.count / maxStage) * 100, 6)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 w-10 shrink-0">
                    <span className={`text-sm font-bold ${isMax ? "text-amber-600" : "text-gray-600"}`}>
                      {d.count}
                    </span>
                    {isMax && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-violet-400" /> เสนอหัวข้อ (PROPOSAL)</span>
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-teal-400" /> สอบวิทยานิพนธ์ (THESIS)</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" /> คอขวด</span>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="space-y-3">
        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อวิทยานิพนธ์ หรือชื่อนักศึกษา..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="pl-9 pr-8 py-3 border border-gray-300 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                statusFilter === tab.value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>
                {(counts as Record<string, number>)[tab.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition ${
                typeFilter === tab.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {tab.label}
              {tab.value !== "ALL" && (
                <span className={`text-xs font-bold ${typeFilter === tab.value ? "text-blue-200" : "text-gray-400"}`}>
                  {tab.value === "PROPOSAL" ? counts.PROPOSAL : counts.THESIS_DEFENSE}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Submission list ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center space-y-2 text-gray-400">
          <Search className="w-10 h-10 mx-auto opacity-25" />
          <p className="text-lg">ไม่พบรายการที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{filtered.length} รายการ</p>
          {filtered.map((sub) => {
            const student     = getStudent(sub.studentId);
            const advisor     = users.find((u) => u.id === sub.advisorId);
            const currentStep = sub.workflowSteps.find((s) => s.status === "PENDING");
            const doneCount   = sub.workflowSteps.filter((s) => s.status === "APPROVED").length;
            const totalSteps  = sub.workflowSteps.length;
            const progressStep = currentStep?.stepOrder ?? totalSteps;
            const stuckDays   = getStuckDays(sub);
            const isStuck     = stuckDays > 7;

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl border-2 p-5 space-y-3 transition ${
                  isStuck ? "border-amber-200" : "border-gray-200"
                }`}
              >
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={sub.submissionType} />
                      <p className="text-lg font-semibold text-gray-900 leading-snug">{sub.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500">
                      {student && (
                        <Link
                          href={`/dashboard/admin/users/${student.id}`}
                          className="font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {student.name}
                          {student.studentId && <span className="text-gray-400 font-normal"> ({student.studentId})</span>}
                        </Link>
                      )}
                      {advisor && <span className="text-gray-400">· ที่ปรึกษา: {advisor.name}</span>}
                      {sub.program && <span className="text-gray-400">· {PROGRAM_LABELS[sub.program] ?? sub.program}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDelete === sub.id ? (
                      <>
                        <span className="text-sm text-red-600 font-medium">ยืนยันลบ?</span>
                        <button
                          onClick={() => { adminDeleteSubmission(sub.id); setConfirmDelete(null); }}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >ลบ</button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg"
                        >ยกเลิก</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDelete(sub.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/dashboard/admin/${sub.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                        >
                          จัดการ
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Status + waiting */}
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusBadge status={sub.status} />
                  {currentStep ? (() => {
                    const { label, detail } = resolvePendingInfo(sub, currentStep, users);
                    return (
                      <span className="text-sm text-orange-600 font-medium">
                        ⏳ ขั้นที่ {currentStep.stepOrder}/{totalSteps}: {label}
                        {detail && <span className="text-orange-500 font-normal"> — {detail}</span>}
                      </span>
                    );
                  })() : sub.status === "COMPLETED" ? (
                    <span className="text-sm text-green-600 font-medium">✓ ผ่านครบทุกขั้นตอน</span>
                  ) : null}
                  {isStuck && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ค้างมา {stuckDays} วัน
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.status === "COMPLETED" ? "bg-green-500" :
                        sub.status === "REJECTED"  ? "bg-red-400"   : "bg-blue-500"
                      }`}
                      style={{ width: `${(progressStep / totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-medium shrink-0">{doneCount}/{totalSteps}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(sub.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, color, subColor = "text-gray-500",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
  subColor?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 space-y-1 ${color}`}>
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className={`text-xs ${subColor}`}>{sub}</p>}
    </div>
  );
}

function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return type === "PROPOSAL" ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full shrink-0">
      <BookOpen className="w-3 h-3" />
      เสนอหัวข้อ
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
      <GraduationCap className="w-3 h-3" />
      สอบ
    </span>
  );
}
