"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, SubmissionFormData } from "@/context/AppContext";
import { PROGRAM_LABELS } from "@/lib/utils";
import { ProgramType } from "@/types";
import { ArrowLeft, User, Users, CalendarDays, Info } from "lucide-react";
import Link from "next/link";

export default function NewSubmissionPage() {
  const router = useRouter();
  const { createSubmission, users } = useApp();

  const advisors        = users.filter((u) => u.role === "ADVISOR");
  const headCandidates  = users.filter((u) => u.role === "HEAD_EXAM_COMMITTEE");
  const committees      = users.filter((u) => u.role === "EXAM_COMMITTEE");
  const invitedCandidates = users.filter((u) => u.role === "INVITED_EXAM_COMMITTEE");

  // ── form state ────────────────────────────────────────────────
  const [title,            setTitle]            = useState("");
  const [advisorId,        setAdvisorId]        = useState("");
  const [studentFullName,  setStudentFullName]  = useState("");
  const [studentCode,      setStudentCode]      = useState("");
  const [program,          setProgram]          = useState<ProgramType | "">("");
  const [studentEmail,     setStudentEmail]     = useState("");
  const [studentPhone,     setStudentPhone]     = useState("");
  const [headCommitteeId,  setHeadCommitteeId]  = useState("");
  const [committeeIds,     setCommitteeIds]     = useState<string[]>([]);
  const [invitedCommittee, setInvitedCommittee] = useState("");
  const [examDate,         setExamDate]         = useState("");
  const [examTime,         setExamTime]         = useState("");
  const [roomNeeded,       setRoomNeeded]       = useState(false);
  const [parkingNeeded,    setParkingNeeded]    = useState(false);
  const [carPlate,         setCarPlate]         = useState("");
  const [error,            setError]            = useState<string | null>(null);

  function toggleCommittee(id: string) {
    setCommitteeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())           { setError("กรุณาระบุชื่อหัวข้อ");      return; }
    if (!studentFullName.trim()) { setError("กรุณาระบุชื่อ-นามสกุล");    return; }
    if (!studentCode.trim())     { setError("กรุณาระบุรหัสนิสิต");       return; }
    if (!program)                { setError("กรุณาเลือกหลักสูตร");        return; }
    if (!studentEmail.trim())    { setError("กรุณาระบุอีเมล");           return; }
    if (!advisorId)              { setError("กรุณาเลือกอาจารย์ที่ปรึกษา"); return; }

    const data: SubmissionFormData = {
      title: title.trim(),
      advisorId,
      studentFullName: studentFullName.trim(),
      studentCode: studentCode.trim(),
      program: program as ProgramType,
      studentEmail: studentEmail.trim(),
      studentPhone: studentPhone.trim(),
      headCommitteeId: headCommitteeId || undefined,
      committeeIds: committeeIds.length ? committeeIds : undefined,
      invitedCommitteeId: invitedCommittee || undefined,
      examDate: examDate || undefined,
      examTime: examTime || undefined,
      roomNeeded,
      parkingNeeded,
      carPlate: parkingNeeded ? carPlate.trim() : undefined,
    };

    const sub = createSubmission(data);
    router.push(`/dashboard/student/${sub.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">ยื่นคำร้องวิทยานิพนธ์</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── ข้อมูลวิทยานิพนธ์ ── */}
        <Section icon={<Info className="w-4 h-4" />} title="ข้อมูลวิทยานิพนธ์">
          <Field label="ชื่อหัวข้อวิทยานิพนธ์" required>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null); }}
              className={INPUT}
              placeholder="เช่น การพัฒนาระบบ..."
            />
          </Field>
        </Section>

        {/* ── ข้อมูลนิสิต ── */}
        <Section icon={<User className="w-4 h-4" />} title="ข้อมูลนิสิต">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ชื่อ-นามสกุล" required>
              <input value={studentFullName} onChange={(e) => setStudentFullName(e.target.value)} className={INPUT} placeholder="ชื่อ นามสกุล" />
            </Field>
            <Field label="รหัสนิสิต" required>
              <input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} className={INPUT} placeholder="เช่น 64010042" />
            </Field>
            <Field label="หลักสูตร" required>
              <select value={program} onChange={(e) => setProgram(e.target.value as ProgramType)} className={INPUT + " bg-white"}>
                <option value="">— เลือกหลักสูตร —</option>
                {(Object.entries(PROGRAM_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="อีเมล" required>
              <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className={INPUT} placeholder="email@ku.th" />
            </Field>
            <Field label="เบอร์โทรศัพท์">
              <input value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className={INPUT} placeholder="0812345678" />
            </Field>
          </div>
        </Section>

        {/* ── คณะกรรมการสอบ ── */}
        <Section icon={<Users className="w-4 h-4" />} title="คณะกรรมการสอบ">
          <Field label="อาจารย์ที่ปรึกษา" required>
            <select value={advisorId} onChange={(e) => setAdvisorId(e.target.value)} className={INPUT + " bg-white"}>
              <option value="">— เลือกอาจารย์ที่ปรึกษา —</option>
              {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="ประธานกรรมการสอบ">
            <select value={headCommitteeId} onChange={(e) => setHeadCommitteeId(e.target.value)} className={INPUT + " bg-white"}>
              <option value="">— เลือกประธานกรรมการสอบ —</option>
              {headCandidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="กรรมการสอบ (เลือกได้หลายคน)">
            <div className="space-y-2">
              {committees.map((c) => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300">
                  <input
                    type="checkbox"
                    checked={committeeIds.includes(c.id)}
                    onChange={() => toggleCommittee(c.id)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-800">{c.name}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="กรรมการภายนอก">
            <select value={invitedCommittee} onChange={(e) => setInvitedCommittee(e.target.value)} className={INPUT + " bg-white"}>
              <option value="">— เลือกกรรมการภายนอก —</option>
              {invitedCandidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">กรรมการภายนอกต้องได้รับการยืนยันจากนักศึกษาก่อนระบุในแบบฟอร์ม</p>
          </Field>
        </Section>

        {/* ── ข้อมูลการสอบ ── */}
        <Section icon={<CalendarDays className="w-4 h-4" />} title="ข้อมูลการสอบ">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="วันที่สอบ">
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={INPUT} />
            </Field>
            <Field label="เวลาสอบ">
              <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} className={INPUT} />
            </Field>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300">
              <input
                type="checkbox"
                checked={roomNeeded}
                onChange={(e) => setRoomNeeded(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-800">ต้องการใช้ห้องประชุม</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300">
              <input
                type="checkbox"
                checked={parkingNeeded}
                onChange={(e) => setParkingNeeded(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-800">ต้องการที่จอดรถสำหรับกรรมการภายนอก</span>
            </label>

            {parkingNeeded && (
              <Field label="เลขทะเบียนรถ" required>
                <input value={carPlate} onChange={(e) => setCarPlate(e.target.value)} className={INPUT} placeholder="เช่น กข 1234 กรุงเทพมหานคร" />
              </Field>
            )}
          </div>
        </Section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-sm text-base"
        >
          ยืนยันยื่นคำร้อง
        </button>
      </form>
    </div>
  );
}

const INPUT = "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 text-gray-700 font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
