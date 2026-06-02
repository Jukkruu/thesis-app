"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, FileText, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  const homeRoute = ROLE_ROUTES[user.role];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900 leading-tight">ระบบจัดการวิทยานิพนธ์</p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">{ROLE_LABELS[user.role]}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink href={homeRoute} icon={<LayoutDashboard className="w-4 h-4" />} label="หน้าหลัก" active={pathname === homeRoute} />
          {user.role === "STUDENT" && (
            <NavLink href="/dashboard/student/submit" icon={<PlusCircle className="w-4 h-4" />} label="ยื่นคำร้องใหม่" active={pathname === "/dashboard/student/submit"} />
          )}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
        active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
