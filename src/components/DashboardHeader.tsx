"use client";

import { Role } from "@/types";
import { ROLE_GRADIENT, ROLE_EMOJI, ROLE_LABELS } from "@/lib/utils";

interface Props {
  role: Role;
  name: string;
  subtitle?: string;
  /** Optional right-side highlight, e.g. pending count */
  highlight?: { label: string; value: number | string };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "สวัสดีตอนเช้า";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

export function DashboardHeader({ role, name, subtitle, highlight }: Props) {
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${ROLE_GRADIENT[role]} p-6 sm:p-7 text-white shadow-lg`}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-12 -right-2 w-32 h-32 bg-white/5 rounded-full" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <span className="text-lg">{ROLE_EMOJI[role]}</span>
            {ROLE_LABELS[role]}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1.5 leading-tight">
            {greeting()}, {name}
          </h1>
          {subtitle && <p className="text-white/80 mt-1 text-sm">{subtitle}</p>}
          <p className="text-white/60 text-xs mt-2">{today}</p>
        </div>

        {highlight && (
          <div className="shrink-0 text-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
            <p className="text-3xl font-bold leading-none">{highlight.value}</p>
            <p className="text-xs text-white/80 mt-1">{highlight.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}
