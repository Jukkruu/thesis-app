"use client";

import { useState } from "react";
import { Download, FileText, History, ChevronDown, ChevronUp } from "lucide-react";
import { FORM_LABELS, FORM_SHORT, formatBytes, formatDate, previewFile } from "@/lib/utils";
import type { MockUpload, FormType } from "@/types";

/** Short primary label — the form code for known types, filename for SIGNED. */
function fileLabel(formType: string, fileName: string): string {
  if (formType === "SIGNED") return fileName.replace(/\.pdf$/i, "");
  return FORM_SHORT[formType as FormType] ?? FORM_LABELS[formType as FormType] ?? formType;
}

/** Subtitle description (e.g. "เสนอหัวข้อวิทยานิพนธ์") extracted from the full label. */
function fileDesc(formType: string): string {
  const full = FORM_LABELS[formType as FormType];
  if (!full) return "";
  const parts = full.split(" — ");
  return parts.length > 1 ? parts[1] : "";
}

interface Group {
  formType: FormType;
  latest: MockUpload;
  history: MockUpload[];
}

function buildGroups(uploads: MockUpload[]): Group[] {
  const groups: Group[] = [];
  const seen = new Set<string>();

  // Preserve FORM_LABELS order first
  for (const ft of Object.keys(FORM_LABELS) as FormType[]) {
    const byType = uploads
      .filter((u) => u.formType === ft)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    if (!byType.length) continue;

    if (ft === "SIGNED") {
      // Each SIGNED file is a different document — show individually (no grouping)
      for (const u of byType) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        groups.push({ formType: ft, latest: u, history: [] });
      }
    } else {
      seen.add(ft);
      groups.push({ formType: ft, latest: byType[0], history: byType.slice(1) });
    }
  }

  // Catch any types not in FORM_LABELS order
  for (const u of uploads) {
    if (!seen.has(u.formType) && !seen.has(u.id)) {
      const byType = uploads
        .filter((x) => x.formType === u.formType)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      seen.add(u.formType);
      groups.push({ formType: u.formType as FormType, latest: byType[0], history: byType.slice(1) });
    }
  }

  return groups;
}

interface Props {
  uploads: MockUpload[];
  submissionTitle: string;
  title?: string;
  compact?: boolean;
  hideHistory?: boolean; // show only latest version per type, no history toggle
}

export function FileList({ uploads, submissionTitle, title = "เอกสารแนบ", compact = false, hideHistory = false }: Props) {
  const [openHistory, setOpenHistory] = useState<Set<string>>(new Set());

  if (!uploads.length) return null;

  const groups = buildGroups(uploads);

  function toggle(key: string) {
    setOpenHistory((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${compact ? "p-4" : "p-5"} space-y-3`}>
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <div className="space-y-2">
        {groups.map(({ formType, latest, history }) => {
          const key = `${formType}-${latest.id}`;
          const isOpen = openHistory.has(key);
          const label = fileLabel(formType, latest.fileName);
          const desc  = fileDesc(formType);
          const isSignedType = formType === "SIGNED";

          return (
            <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
              {/* Latest / primary row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-snug truncate">{label}</p>
                  {desc && <p className="text-xs text-gray-500 truncate">{desc}</p>}
                  <p className="text-xs text-gray-400 truncate">
                    {isSignedType
                      ? `${formatBytes(latest.fileSize)} · ${formatDate(latest.uploadedAt)}`
                      : `${latest.fileName} · ${formatBytes(latest.fileSize)} · ${formatDate(latest.uploadedAt)}`}
                  </p>
                </div>
                <button
                  onClick={() => previewFile(latest.fileUrl, latest.fileName)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  ดูเอกสาร
                </button>
              </div>

              {/* History */}
              {!hideHistory && history.length > 0 && (
                <>
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition border-t border-gray-100"
                  >
                    <History className="w-3.5 h-3.5" />
                    ประวัติ ({history.length} เวอร์ชันก่อนหน้า)
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gray-100 bg-white border-t border-gray-100">
                      {history.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                          <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 truncate">{u.fileName} · {formatBytes(u.fileSize)}</p>
                            <p className="text-xs text-gray-400">{formatDate(u.uploadedAt)}</p>
                          </div>
                          <button onClick={() => previewFile(u.fileUrl, u.fileName)}>
                            <Download className="w-3.5 h-3.5 text-gray-300 hover:text-blue-500 transition" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
