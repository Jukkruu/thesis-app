"use client";

import { MockWorkflowStep } from "@/types";
import { ROLE_LABELS, STEP_NAMES, formatDate } from "@/lib/utils";
import { StepStatusBadge } from "./StatusBadge";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkflowTimeline({ steps }: { steps: MockWorkflowStep[] }) {
  const currentOrder = steps.find((s) => s.status === "PENDING")?.stepOrder ?? null;

  return (
    <ol className="relative border-l-2 border-gray-100 ml-3 space-y-0">
      {steps.map((step) => {
        const isCurrent = step.stepOrder === currentOrder;
        const isFuture  = step.status === "PENDING" && !isCurrent;

        return (
          <li
            key={step.id}
            className={cn(
              "ml-6 pb-7 last:pb-0",
              isFuture && "opacity-40"
            )}
          >
            {/* Timeline dot */}
            <span
              className={cn(
                "absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4",
                isCurrent  ? "ring-blue-100 bg-blue-50"
                : step.status === "APPROVED" ? "ring-green-50 bg-white"
                : step.status === "REJECTED" ? "ring-red-50 bg-white"
                : "ring-gray-50 bg-white"
              )}
            >
              {step.status === "APPROVED" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {step.status === "REJECTED" && <XCircle      className="w-5 h-5 text-red-500" />}
              {isCurrent                  && <Clock        className="w-5 h-5 text-blue-500" />}
              {isFuture                   && <Circle       className="w-5 h-5 text-gray-300" />}
            </span>

            {/* Content */}
            <div
              className={cn(
                "rounded-xl p-3",
                isCurrent && "bg-blue-50 border border-blue-200"
              )}
            >
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-400 font-medium">ขั้นที่ {step.stepOrder}</span>
                <span className={cn("font-semibold", isCurrent ? "text-blue-800" : "text-gray-800")}>
                  {STEP_NAMES[step.stepOrder] ?? ROLE_LABELS[step.role]}
                </span>
                <StepStatusBadge status={step.status} />
                {isCurrent && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    ● กำลังดำเนินการ
                  </span>
                )}
              </div>

              {step.actedByName && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {step.actedByName}
                  {step.actedAt && <span className="text-gray-400"> · {formatDate(step.actedAt)}</span>}
                </p>
              )}

              {/* Committee signing progress */}
              {step.committeeMembers && step.committeeMembers.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  กรรมการลงนาม{" "}
                  <span className="font-semibold text-gray-700">
                    {(step.committeeActions ?? []).filter((a) => a.decision === "APPROVED").length}
                    /{step.committeeMembers.length}
                  </span>
                  {" "}ท่าน
                </p>
              )}
              {step.notes && (
                <p className="mt-1.5 text-sm text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2">
                  "{step.notes}"
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
