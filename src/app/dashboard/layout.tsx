"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_ROUTES } from "@/lib/roleRoutes";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, PlusCircle } from "lucide-react";
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
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-gray-100">
          <p className="font-bold text-gray-900 leading-snug">ระบบจัดการวิทยานิพนธ์</p>
          <p className="text-sm font-medium text-blue-600 mt-1">{ROLE_LABELS[user.role]}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            href={homeRoute}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="หน้าหลัก"
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
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="px-3 py-2 bg-gray-50 rounded-xl">
            <p className="font-medium text-gray-800 truncate">{user.name}</p>
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

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8 bg-gray-50">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
