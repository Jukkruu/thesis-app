"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, SubmissionFormData } from "@/context/AppContext";
import { PROGRAM_LABELS } from "@/lib/utils";
import { MockUser, ProgramType } from "@/types";
import { ArrowLeft, User, Users, CalendarDays, Info, Search, X, Check, ChevronDown } from "lucide-react";
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
              <li className="px-4 py-3 text-sm text-gray-400 text-center">ไม่พบชื่อที่ค้นหา</li>
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
  const { createSubmission, users } = useApp();

  const advisors          = users.filter((u) => u.role === "ADVISOR");
  const headCandidates    = users.filter((u) => u.role === "HEAD_EXAM_COMMITTEE");
  const committees        = users.filter((u) => u.role === "EXAM_COMMITTEE");
  const invitedCandidates = users.filter((u) => u.role === "INVITED_EXAM_COMMITTEE");

  const [title,           setTitle]           = useState("");
  const [advisorId,       setAdvisorId]       = useState("");
  const [studentFullName, setStudentFullName] = useState("");
  const [studentCode,     setStudentCode]     = useState("");
  const [program,         setProgram]         = useState<ProgramType | "">("");
  const [studentEmail,    setStudentEmail]    = useState("");
  const [studentPhone,    setStudentPhone]    = useState("");
  const [headCommitteeId, setHeadCommitteeId] = useState("");
  const [committeeIds,    setCommitteeIds]    = useState<string[]>([]);
  const [invitedId,       setInvitedId]       = useState("");
  const [examDate,        setExamDate]        = useState("");
  const [examTime,        setExamTime]        = useState("");
  const [roomNeeded,      setRoomNeeded]      = useState(false);
  const [parkingNeeded,   setParkingNeeded]   = useState(false);
  const [carPlate,        setCarPlate]        = useState("");
  const [error,           setError]           = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())           { setError("กรุณาระบุชื่อหัวข้อ");       return; }
    if (!studentFullName.trim()) { setError("กรุณาระบุชื่อ-นามสกุล");     return; }
    if (!studentCode.trim())     { setError("กรุณาระบุรหัสนิสิต");        return; }
    if (!program)                { setError("กรุณาเลือกหลักสูตร");         return; }
    if (!studentEmail.trim())    { setError("กรุณาระบุอีเมล");            return; }
    if (!advisorId)              { setError("กรุณาเลือกอาจารย์ที่ปรึกษา"); return; }

    const data: SubmissionFormData = {
      title: title.trim(),
      advisorId,
      studentFullName: studentFullName.trim(),
      studentCode: studentCode.trim(),
      program: program as ProgramType,
      studentEmail: studentEmail.trim(),
      studentPhone: studentPhone.trim(),
      headCommitteeId:   headCommitteeId || undefined,
      committeeIds:      committeeIds.length ? committeeIds : undefined,
      invitedCommitteeId: invitedId || undefined,
      examDate:     examDate || undefined,
      examTime:     examTime || undefined,
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

          <Field label="กรรมการภายนอก">
            <SearchableSelect
              options={invitedCandidates}
              value={invitedId}
              onChange={setInvitedId}
              placeholder="ค้นหากรรมการภายนอก..."
            />
            <p className="text-xs text-gray-400 mt-1">กรรมการภายนอกต้องได้รับการยืนยันจากนักศึกษาก่อน</p>
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
