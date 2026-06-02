"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LogOut, LayoutDashboard, PlusCircle, ShieldCheck,
  Users, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, getPendingCount } = useApp();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!user) return null;

  const homeRoute   = ROLE_ROUTES[user.role];
  const pendingCount = user.role !== "STUDENT" && user.role !== "ADMIN"
    ? getPendingCount(user.role)
    : 0;

  const sidebar = (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 leading-tight">ระบบจัดการวิทยานิพนธ์</p>
          <p className="text-sm font-medium text-blue-600 mt-0.5">{ROLE_LABELS[user.role]}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          href={homeRoute}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="หน้าหลัก"
          badge={pendingCount}
          active={pathname === homeRoute}
        />

        {user.role === "STUDENT" && (
          <NavLink
            href="/dashboard/student/submit"
            icon={<PlusCircle className="w-5 h-5" />}
            label="ยื่นคำร้องใหม่"
            active={pathname === "/dashboard/student/submit"}
          />
        )}

        {user.role === "ADMIN" && (
          <>
            <NavLink
              href="/dashboard/admin"
              icon={<ShieldCheck className="w-5 h-5" />}
              label="ภาพรวมคำร้อง"
              active={
                pathname === "/dashboard/admin" ||
                (pathname.startsWith("/dashboard/admin/") &&
                  !pathname.startsWith("/dashboard/admin/users"))
              }
            />
            <NavLink
              href="/dashboard/admin/users"
              icon={<Users className="w-5 h-5" />}
              label="ผู้ใช้งานในระบบ"
              active={pathname === "/dashboard/admin/users"}
            />
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="px-3 py-2.5 bg-gray-50 rounded-xl">
          <p className="font-semibold text-gray-800 truncate">{user.name}</p>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-600 font-medium hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">ระบบจัดการวิทยานิพนธ์</p>
          <p className="text-xs text-blue-600 font-medium">{ROLE_LABELS[user.role]}</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:shrink-0 lg:min-h-screen">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden overflow-y-auto">
            {sidebar}
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto p-5 lg:p-8 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href, icon, label, active, badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition",
        active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
