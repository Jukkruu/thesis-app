"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const mine = notifications
    .filter((n) => n.recipientId === user?.id)
    .slice(0, 20);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleClick(notif: MockNotification) {
    markNotificationRead(notif.id);
    setOpen(false);
    if (!user) return;
    if (user.role === "STUDENT") router.push(`/dashboard/student/${notif.submissionId}`);
    else if (user.role === "ADMIN") router.push(`/dashboard/admin/${notif.submissionId}`);
    else {
      const base = ROLE_ROUTES[user.role];
      router.push(`${base}/${notif.submissionId}`);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
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

      {/* Dropdown — fixed on mobile, absolute on desktop */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />

          <div className={[
            "z-50 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden",
            // Mobile: full-width panel near top
            "fixed top-14 left-3 right-3",
            // Desktop: standard dropdown
            "lg:absolute lg:top-10 lg:right-0 lg:left-auto lg:w-80 lg:fixed-none",
          ].join(" ")}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-orange-600">({unreadCount} ใหม่)</span>
                )}
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
                <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 lg:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[60vh] lg:max-h-96 overflow-y-auto divide-y divide-gray-50">
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
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{notif.detail}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${s.dot}`} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {mine.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  {mine.filter((n) => !n.isRead).length > 0
                    ? `${mine.filter((n) => !n.isRead).length} รายการยังไม่ได้อ่าน`
                    : "✓ อ่านทั้งหมดแล้ว"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
