"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, SubmissionFormData } from "@/context/AppContext";
import { PROGRAM_LABELS, ROLE_LABELS } from "@/lib/utils";
import { ProgramType, SubmissionType } from "@/types";
import { ArrowLeft, User, Users, CalendarDays, Info, X, Plus, BookOpen, GraduationCap, AlertCircle } from "lucide-react";
import Link from "next/link";

// ─── Committee person entry ───────────────────────────────────────────────────

const PERSON_ROLES = [
  "ADVISOR",
  "CO_ADVISOR",
  "HEAD_EXAM_COMMITTEE",
  "EXAM_COMMITTEE",
  "INVITED_EXAM_COMMITTEE",
  "PROGRAM_CHAIR",
] as const;

interface Person {
  name: string;
  email: string;
  role: string;
  phone: string;
}

const emptyPerson = (role = ""): Person => ({ name: "", email: "", role, phone: "" });

const initialPeople = (): Person[] => [emptyPerson()];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewSubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const submissionType: SubmissionType =
    rawType === "defense" ? "THESIS_DEFENSE" : "PROPOSAL";

  const isProposal = submissionType === "PROPOSAL";
  const formTitle  = isProposal ? "ขอสอบโครงร่างวิทยานิพนธ์" : "ขอสอบวิทยานิพนธ์";
  const formDesc   = isProposal
    ? "คำร้องขอสอบโครงร่างวิทยานิพนธ์ (บ.วศ.1ก / บ.วศ.1ข / บ.วศ.1ค / บ.วศ.1ง)"
    : "คำร้องขอสอบวิทยานิพนธ์ (บ.2 / บ.3 / บ.4)";

  const { createSubmission, user } = useApp();

  const [title,           setTitle]           = useState("");
  const [studentFullName, setStudentFullName] = useState("");
  const [studentCode,     setStudentCode]     = useState("");
  const [program,         setProgram]         = useState<ProgramType | "">("");
  const [studentEmail,    setStudentEmail]    = useState("");
  const [studentPhone,    setStudentPhone]    = useState("");
  const [people,          setPeople]          = useState<Person[]>(initialPeople);
  const [examDate,        setExamDate]        = useState("");
  const [examTime,        setExamTime]        = useState("");
  const [roomNeeded,      setRoomNeeded]      = useState(false);
  const [parkingNeeded,   setParkingNeeded]   = useState(false);
  const [carPlate,        setCarPlate]        = useState("");
  const [error,           setError]           = useState<string | null>(null);
  const [confirmed,       setConfirmed]       = useState(false);
  const [submitting,      setSubmitting]      = useState(false);

  // Prefill student info from the logged-in account (still editable)
  useEffect(() => {
    if (!user) return;
    setStudentFullName((v) => v || user.name || "");
    setStudentCode((v) => v || user.studentId || "");
    setStudentEmail((v) => v || user.email || "");
  }, [user]);

  const chairCount = people.filter((p) => p.role === "PROGRAM_CHAIR").length;

  // Live checklist of required roles — updates as the student fills in people
  const ROLE_REQUIREMENTS: { role: string; label: string; min: number; max: number | null }[] = [
    { role: "ADVISOR",                label: "อาจารย์ที่ปรึกษา",   min: 1, max: 1 },
    { role: "PROGRAM_CHAIR",          label: "ประธานหลักสูตร",     min: 1, max: 1 },
    { role: "HEAD_EXAM_COMMITTEE",    label: "ประธานกรรมการสอบ",  min: 1, max: 1 },
    { role: "EXAM_COMMITTEE",         label: "กรรมการสอบ",         min: 1, max: null },
    { role: "INVITED_EXAM_COMMITTEE", label: "กรรมการภายนอก",      min: 1, max: 1 },
  ];

  function updatePerson(index: number, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    setError(null);
  }
  function addPerson() {
    setPeople((prev) => [...prev, emptyPerson()]);
  }
  function removePerson(index: number) {
    setPeople((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())           { setError("กรุณาระบุชื่อหัวข้อ");     return; }
    if (!studentFullName.trim()) { setError("กรุณาระบุชื่อ-นามสกุล");   return; }
    if (!studentCode.trim())     { setError("กรุณาระบุรหัสนิสิต");      return; }
    if (!program)                { setError("กรุณาเลือกหลักสูตร");       return; }
    if (!studentEmail.trim())    { setError("กรุณาระบุอีเมล");          return; }

    const seenRoleEmail = new Set<string>();
    for (const [i, p] of people.entries()) {
      if (!p.name.trim())  { setError(`กรุณาระบุชื่อ-นามสกุลของบุคคลที่ ${i + 1}`); return; }
      if (!p.email.trim()) { setError(`กรุณาระบุอีเมลของบุคคลที่ ${i + 1}`);        return; }
      if (!p.role)         { setError(`กรุณาเลือกบทบาทของบุคคลที่ ${i + 1}`);       return; }
      const email = p.email.trim().toLowerCase();
      if (email === user?.email?.toLowerCase() || email === studentEmail.trim().toLowerCase()) {
        setError(`บุคคลที่ ${i + 1}: ไม่สามารถใช้อีเมลของท่านเองเป็นกรรมการได้`); return;
      }
      const key = `${p.role}:${email}`;
      if (seenRoleEmail.has(key)) {
        setError(`บุคคลที่ ${i + 1}: อีเมลนี้ถูกเพิ่มในบทบาทเดียวกันแล้ว`); return;
      }
      seenRoleEmail.add(key);
    }
    const count = (r: string) => people.filter((p) => p.role === r).length;
    if (count("PROGRAM_CHAIR") !== 1)          { setError("ต้องระบุประธานหลักสูตร 1 คน (เพิ่มได้เพียง 1 คนเท่านั้น)"); return; }
    if (count("ADVISOR") !== 1)                { setError("ต้องระบุอาจารย์ที่ปรึกษา 1 คน");        return; }
    if (count("HEAD_EXAM_COMMITTEE") !== 1)    { setError("ต้องระบุประธานกรรมการสอบ 1 คน");        return; }
    if (count("EXAM_COMMITTEE") < 1)           { setError("ต้องระบุกรรมการสอบอย่างน้อย 1 คน");     return; }
    if (count("INVITED_EXAM_COMMITTEE") !== 1) { setError("ต้องระบุกรรมการภายนอก 1 คน");           return; }

    if (!examDate.trim()) { setError("กรุณาระบุวันที่สอบ"); return; }
    if (!examTime.trim()) { setError("กรุณาระบุเวลาสอบ");   return; }
    if (parkingNeeded && !carPlate.trim()) { setError("กรุณาระบุเลขทะเบียนรถ"); return; }

    setError(null);
    setSubmitting(true);
    try {
      const data: SubmissionFormData = {
        title: title.trim(),
        submissionType,
        studentFullName: studentFullName.trim(),
        studentCode: studentCode.trim(),
        program: program as ProgramType,
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim(),
        people: people.map((p) => ({
          name: p.name.trim(),
          email: p.email.trim(),
          role: p.role,
          phone: p.phone.trim() || undefined,
        })),
        examDate: examDate || undefined,
        examTime: examTime || undefined,
        roomNeeded,
        parkingNeeded,
        carPlate: parkingNeeded ? carPlate.trim() : undefined,
      };
      const sub = await createSubmission(data);
      router.push(`/dashboard/student/${sub.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 py-2 -my-2">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      {/* Form type header */}
      <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 ${isProposal ? "bg-blue-50 border border-blue-200" : "bg-indigo-50 border border-indigo-200"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isProposal ? "bg-blue-600" : "bg-indigo-600"}`}>
          {isProposal
            ? <BookOpen className="w-5 h-5 text-white" />
            : <GraduationCap className="w-5 h-5 text-white" />
          }
        </div>
        <div>
          <h1 className={`text-xl font-bold ${isProposal ? "text-blue-900" : "text-indigo-900"}`}>{formTitle}</h1>
          <p className={`text-sm mt-0.5 ${isProposal ? "text-blue-600" : "text-indigo-600"}`}>{formDesc}</p>
        </div>
      </div>

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
              <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className={INPUT} placeholder="email@chula.ac.th" />
            </Field>
            <Field label="เบอร์โทรศัพท์">
              <input value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className={INPUT} placeholder="0812345678" />
            </Field>
          </div>
        </Section>

        {/* ── ผู้รับผิดชอบวิทยานิพนธ์ ── */}
        <Section icon={<Users className="w-4 h-4" />} title="ผู้รับผิดชอบวิทยานิพนธ์">
          <div className="text-xs text-gray-500 -mt-1">
            <p>กรอกข้อมูลอาจารย์และกรรมการที่รับผิดชอบวิทยานิพนธ์ของท่านด้วยตนเอง — ระบบจะสร้างบัญชีและส่งอีเมลแจ้งแต่ละท่านโดยอัตโนมัติ (อาจารย์ที่ปรึกษาร่วมเพิ่มได้ตามต้องการ)</p>
          </div>

          {/* Live checklist — turns green as each required role is covered */}
          <div className="flex flex-wrap gap-1.5">
            {ROLE_REQUIREMENTS.map(({ role, label, min, max }) => {
              const n = people.filter((p) => p.role === role).length;
              const over = max !== null && n > max;
              const ok = n >= min && !over;
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    over ? "bg-red-50 border-red-200 text-red-600"
                    : ok ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  {ok ? "✓" : over ? "✗" : "○"} {label}
                  {max === null ? ` (${n})` : over ? ` (${n} — เกิน)` : ""}
                </span>
              );
            })}
          </div>

          <div className="space-y-3">
            {people.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">บุคคลที่ {i + 1}</span>
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(i)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      aria-label="ลบบุคคลนี้"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="ชื่อ-นามสกุล (พร้อมตำแหน่ง)" required>
                    <input
                      value={p.name}
                      onChange={(e) => updatePerson(i, { name: e.target.value })}
                      className={INPUT}
                      placeholder="เช่น รศ.ดร.สมชาย ใจดี"
                    />
                  </Field>
                  <Field label="อีเมล" required>
                    <input
                      type="email"
                      value={p.email}
                      onChange={(e) => updatePerson(i, { email: e.target.value })}
                      className={INPUT}
                      placeholder="email@chula.ac.th"
                    />
                  </Field>
                  <Field label="บทบาท" required>
                    <select
                      value={p.role}
                      onChange={(e) => updatePerson(i, { role: e.target.value })}
                      className={INPUT + " bg-white"}
                    >
                      <option value="">— เลือกบทบาท —</option>
                      {PERSON_ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          disabled={r === "PROGRAM_CHAIR" && chairCount >= 1 && p.role !== "PROGRAM_CHAIR"}
                        >
                          {ROLE_LABELS[r] ?? r}
                          {r === "PROGRAM_CHAIR" ? " (ได้ 1 คน)" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="เบอร์โทรศัพท์">
                    <input
                      value={p.phone}
                      onChange={(e) => updatePerson(i, { phone: e.target.value })}
                      className={INPUT}
                      placeholder="0812345678"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPerson}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            เพิ่มบุคคล
          </button>
        </Section>

        {/* ── ข้อมูลการสอบ ── */}
        <Section icon={<CalendarDays className="w-4 h-4" />} title="ข้อมูลการสอบ">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="วันที่สอบ" required>
              <input type="date" value={examDate} onChange={(e) => { setExamDate(e.target.value); setError(null); }} className={INPUT} />
            </Field>
            <Field label="เวลาสอบ" required>
              <input type="time" value={examTime} onChange={(e) => { setExamTime(e.target.value); setError(null); }} className={INPUT} />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300">
              <input type="checkbox" checked={roomNeeded} onChange={(e) => setRoomNeeded(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-800">ต้องการใช้ห้องประชุม</span>
            </label>
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300">
              <input type="checkbox" checked={parkingNeeded} onChange={(e) => setParkingNeeded(e.target.checked)} className="w-4 h-4 accent-blue-600" />
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

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            กรุณาตรวจสอบก่อนส่ง
          </p>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0"
            />
            <span className="text-xs text-amber-800">
              ตรวจสอบข้อมูลทั้งหมดถูกต้องและครบถ้วนแล้ว
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!confirmed || submitting}
          className={`w-full py-3.5 text-white font-semibold rounded-xl transition shadow-sm text-base disabled:opacity-50 ${
            isProposal
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {submitting ? "กำลังยื่น..." : `ยืนยัน — ${formTitle}`}
        </button>
      </form>
    </div>
  );
}

const INPUT = "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
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
