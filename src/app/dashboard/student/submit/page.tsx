"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, SubmissionFormData } from "@/context/AppContext";
import { PROGRAM_LABELS } from "@/lib/utils";
import { MockUser, ProgramType, SubmissionType } from "@/types";
import { ArrowLeft, User, Users, CalendarDays, Info, Search, X, Check, ChevronDown, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

// ─── Searchable single-select ─────────────────────────────────────────────────

function SearchableSelect({
  options, value, onChange, placeholder,
}: {
  options: MockUser[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) =>
    !query || o.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="w-full flex items-center justify-between border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่ออาจารย์..."
                className="flex-1 text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {options.length === 0
                  ? "ยังไม่มีข้อมูลในระบบ — กรุณาติดต่อผู้ดูแลระบบ"
                  : "ไม่พบชื่อที่ค้นหา"}
              </li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between ${
                      o.id === value ? "text-blue-700 bg-blue-50 font-medium" : "text-gray-800"
                    }`}
                  >
                    {o.name}
                    {o.id === value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Multi-select chip picker ─────────────────────────────────────────────────

function MultiPicker({
  options, selected, onChange, placeholder,
}: {
  options: MockUser[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const unselected = options.filter(
    (o) => !selected.includes(o.id) &&
      (!query || o.name.toLowerCase().includes(query.toLowerCase()))
  );

  function add(id: string) {
    onChange([...selected, id]);
    setQuery("");
  }
  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  return (
    <div ref={ref}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((id) => {
            const prof = options.find((o) => o.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {prof?.name ?? id}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="ml-0.5 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length ? `เพิ่มกรรมการสอบ... (เลือกแล้ว ${selected.length} คน)` : placeholder}
            className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
          />
        </button>

        {/* Dropdown */}
        {open && unselected.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
            {unselected.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => { add(o.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700"
                >
                  {o.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && unselected.length === 0 && query && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm py-3 text-sm text-gray-400 text-center">
            ไม่พบชื่อที่ค้นหา
          </div>
        )}
        {open && unselected.length === 0 && !query && selected.length === options.length && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm py-3 text-sm text-gray-400 text-center">
            เลือกครบทุกคนแล้ว
          </div>
        )}
      </div>
    </div>
  );
}

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

  const { createSubmission, users } = useApp();

  const advisors       = users.filter((u) => u.role === "ADVISOR");
  const headCandidates = users.filter((u) => u.role === "HEAD_EXAM_COMMITTEE");
  const committees     = users.filter((u) => u.role === "EXAM_COMMITTEE");

  const [title,              setTitle]              = useState("");
  const [advisorId,          setAdvisorId]          = useState("");
  const [studentFullName,    setStudentFullName]    = useState("");
  const [studentCode,        setStudentCode]        = useState("");
  const [program,            setProgram]            = useState<ProgramType | "">("");
  const [studentEmail,       setStudentEmail]       = useState("");
  const [studentPhone,       setStudentPhone]       = useState("");
  const [headCommitteeId,    setHeadCommitteeId]    = useState("");
  const [committeeIds,       setCommitteeIds]       = useState<string[]>([]);
  const [invitedProfName,    setInvitedProfName]    = useState("");
  const [invitedProfAffil,   setInvitedProfAffil]   = useState("");
  const [invitedProfEmail,   setInvitedProfEmail]   = useState("");
  const [invitedProfPhone,   setInvitedProfPhone]   = useState("");
  const [examDate,           setExamDate]           = useState("");
  const [examTime,           setExamTime]           = useState("");
  const [roomNeeded,         setRoomNeeded]         = useState(false);
  const [parkingNeeded,      setParkingNeeded]      = useState(false);
  const [carPlate,           setCarPlate]           = useState("");
  const [error,              setError]              = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())           { setError("กรุณาระบุชื่อหัวข้อ");       return; }
    if (!studentFullName.trim()) { setError("กรุณาระบุชื่อ-นามสกุล");     return; }
    if (!studentCode.trim())     { setError("กรุณาระบุรหัสนิสิต");        return; }
    if (!program)                { setError("กรุณาเลือกหลักสูตร");         return; }
    if (!studentEmail.trim())    { setError("กรุณาระบุอีเมล");            return; }
    if (!advisorId)              { setError("กรุณาเลือกอาจารย์ที่ปรึกษา");             return; }
    if (!invitedProfName.trim()) { setError("กรุณาระบุชื่อ-นามสกุลกรรมการภายนอก");    return; }
    if (!invitedProfAffil.trim()){ setError("กรุณาระบุสังกัดกรรมการภายนอก");           return; }
    if (!invitedProfEmail.trim()){ setError("กรุณาระบุอีเมลกรรมการภายนอก");            return; }
    if (!invitedProfPhone.trim()){ setError("กรุณาระบุเบอร์โทรศัพท์กรรมการภายนอก");   return; }

    const data: SubmissionFormData = {
      title: title.trim(),
      submissionType,
      advisorId,
      studentFullName: studentFullName.trim(),
      studentCode: studentCode.trim(),
      program: program as ProgramType,
      studentEmail: studentEmail.trim(),
      studentPhone: studentPhone.trim(),
      headCommitteeId:      headCommitteeId || undefined,
      committeeIds:         committeeIds.length ? committeeIds : undefined,
      invitedProfName:      invitedProfName.trim() || undefined,
      invitedProfAffiliation: invitedProfAffil.trim() || undefined,
      invitedProfEmail:     invitedProfEmail.trim() || undefined,
      invitedProfPhone:     invitedProfPhone.trim() || undefined,
      examDate:     examDate || undefined,
      examTime:     examTime || undefined,
      roomNeeded,
      parkingNeeded,
      carPlate: parkingNeeded ? carPlate.trim() : undefined,
    };

    const sub = await createSubmission(data);
    router.push(`/dashboard/student/${sub.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับ
      </Link>

      {/* Warning: no staff accounts yet */}
      {(advisors.length === 0 || headCandidates.length === 0 || committees.length === 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
          <div className="text-sm text-amber-800 space-y-0.5">
            <p className="font-semibold">บัญชีผู้ใช้ยังไม่ครบ</p>
            <p className="text-amber-700">
              {[
                advisors.length === 0 && "อาจารย์ที่ปรึกษา",
                headCandidates.length === 0 && "ประธานกรรมการสอบ",
                committees.length === 0 && "กรรมการสอบ",
              ].filter(Boolean).join(", ")}
              {" "}ยังไม่มีในระบบ — กรุณาให้ผู้ดูแลระบบเพิ่มบัญชีผู้ใช้ก่อนยื่นคำร้อง
            </p>
          </div>
        </div>
      )}

      {/* Form type header */}
      <div className={`rounded-2xl p-5 flex items-start gap-4 ${isProposal ? "bg-blue-50 border border-blue-200" : "bg-indigo-50 border border-indigo-200"}`}>
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

        {/* ── คณะกรรมการสอบ ── */}
        <Section icon={<Users className="w-4 h-4" />} title="คณะกรรมการสอบ">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="อาจารย์ที่ปรึกษา" required>
              <SearchableSelect
                options={advisors}
                value={advisorId}
                onChange={(id) => { setAdvisorId(id); setError(null); }}
                placeholder="ค้นหาอาจารย์ที่ปรึกษา..."
              />
            </Field>
            <Field label="ประธานกรรมการสอบ">
              <SearchableSelect
                options={headCandidates}
                value={headCommitteeId}
                onChange={setHeadCommitteeId}
                placeholder="ค้นหาประธานกรรมการสอบ..."
              />
            </Field>
          </div>

          <Field label={`กรรมการสอบ${committeeIds.length ? ` (${committeeIds.length} คน)` : ""}`}>
            <MultiPicker
              options={committees}
              selected={committeeIds}
              onChange={setCommitteeIds}
              placeholder="ค้นหาและเพิ่มกรรมการสอบ..."
            />
          </Field>

          <div className="col-span-full">
            <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">กรรมการภายนอก (External Committee)</p>
              <p className="text-xs text-gray-400 -mt-1">กรรมการภายนอกต้องติดต่อและยืนยันล่วงหน้าก่อนกรอกข้อมูล</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="ชื่อ-นามสกุล (พร้อมตำแหน่ง)" required>
                  <input
                    value={invitedProfName}
                    onChange={(e) => { setInvitedProfName(e.target.value); setError(null); }}
                    className={INPUT}
                    placeholder="เช่น ศ.ดร.สมชาย ใจดี"
                  />
                </Field>
                <Field label="สังกัด / มหาวิทยาลัย" required>
                  <input
                    value={invitedProfAffil}
                    onChange={(e) => { setInvitedProfAffil(e.target.value); setError(null); }}
                    className={INPUT}
                    placeholder="เช่น มหาวิทยาลัยเกษตรศาสตร์"
                  />
                </Field>
                <Field label="อีเมล" required>
                  <input
                    type="email"
                    value={invitedProfEmail}
                    onChange={(e) => { setInvitedProfEmail(e.target.value); setError(null); }}
                    className={INPUT}
                    placeholder="email@university.ac.th"
                  />
                </Field>
                <Field label="เบอร์โทรศัพท์" required>
                  <input
                    value={invitedProfPhone}
                    onChange={(e) => { setInvitedProfPhone(e.target.value); setError(null); }}
                    className={INPUT}
                    placeholder="0812345678"
                  />
                </Field>
              </div>
            </div>
          </div>
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

        <button
          type="submit"
          className={`w-full py-3.5 text-white font-semibold rounded-xl transition shadow-sm text-base ${
            isProposal
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          ยืนยันยื่นคำร้อง — {formTitle}
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
