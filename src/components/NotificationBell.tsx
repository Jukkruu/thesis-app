"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Bell, CheckCheck, Clock, CheckCircle2, XCircle, Info, X } from "lucide-react";
import { MockNotification, NotificationType } from "@/types";

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "เมื่อกี้";
  if (mins < 60)  return `${mins} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 30)  return `${days} วันที่แล้ว`;
  return `${Math.floor(days / 30)} เดือนที่แล้ว`;
}

const STYLES: Record<NotificationType, { bg: string; dot: string; icon: React.ReactNode }> = {
  pending:  { bg: "bg-orange-50", dot: "bg-orange-400", icon: <Clock        className="w-4 h-4 text-orange-500" /> },
  approved: { bg: "bg-green-50",  dot: "bg-green-500",  icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
  rejected: { bg: "bg-red-50",    dot: "bg-red-500",    icon: <XCircle      className="w-4 h-4 text-red-500"   /> },
  info:     { bg: "bg-blue-50",   dot: "bg-blue-400",   icon: <Info         className="w-4 h-4 text-blue-500"  /> },
};

export function NotificationBell() {
  const { user, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const router  = useRouter();
  const [open, setOpen]     = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const mine = notifications
    .filter((n) => n.recipientId === user?.id)
    .slice(0, 20);

  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 24);
    // Anchor near the bell, but keep fully on-screen
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    setCoords({ top: r.bottom + 10, left, width });
  }, []);

  function toggle() {
    if (!open) reposition();
    setOpen((v) => !v);
  }

  // Reposition on resize; close on Escape
  useEffect(() => {
    if (!open) return;
    function onResize() { reposition(); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, reposition]);

  function handleClick(notif: MockNotification) {
    markNotificationRead(notif.id);
    setOpen(false);
    if (!user) return;
    if (user.role === "STUDENT")    router.push(`/dashboard/student/${notif.submissionId}`);
    else if (user.role === "ADMIN") router.push(`/dashboard/admin/${notif.submissionId}`);
    else {
      const seg = {
        ADVISOR: "advisor", PROGRAM_CHAIR: "program-chair", EXAM_COMMITTEE: "exam-committee",
        DEPT_STAFF: "dept-staff", FACULTY_DEAN: "faculty-dean", GRADUATE_SCHOOL: "graduate-school",
      }[user.role as string] ?? "";
      router.push(`/dashboard/${seg}/${notif.submissionId}`);
    }
  }

  return (
    <>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={toggle}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown via portal — never clipped by the sidebar */}
      {mounted && open && coords && createPortal(
        <>
          {/* Transparent click-catcher */}
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />

          <div
            className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                การแจ้งเตือน
                {unreadCount > 0 && <span className="ml-2 text-sm font-normal text-orange-600">({unreadCount} ใหม่)</span>}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    อ่านทั้งหมด
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
              {mine.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto opacity-25" />
                  <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                mine.map((notif) => {
                  const s = STYLES[notif.type];
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition flex items-start gap-3 ${!notif.isRead ? s.bg : ""}`}
                    >
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-gray-100">
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{notif.detail}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${s.dot}`} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
