"use client";

import { MockUser, MockWorkflowStep } from "@/types";
import { ROLE_LABELS, getStepName, formatDate } from "@/lib/utils";
import { StepStatusBadge } from "./StatusBadge";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkflowTimeline({
  steps,
  users = [],
  submissionType,
}: {
  steps: MockWorkflowStep[];
  users?: MockUser[];
  submissionType?: string | null;
}) {
  const currentOrder = steps.find((s) => s.status === "PENDING")?.stepOrder ?? null;
  const remainingCount = currentOrder !== null
    ? steps.filter((s) => s.status === "PENDING" && s.stepOrder > currentOrder).length
    : 0;

  return (
    <>
      {remainingCount > 0 && (
        <p className="text-xs text-gray-400 mb-4">
          เหลืออีก <span className="font-semibold text-gray-600">{remainingCount}</span> ขั้นตอนหลังจากนี้
        </p>
      )}
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
                    {getStepName(step.stepOrder, submissionType) || ROLE_LABELS[step.role]}
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

                {/* Committee signing progress — show each member's status */}
                {step.committeeMembers && step.committeeMembers.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">
                      ลงนามแล้ว{" "}
                      <span className="font-bold text-gray-700">
                        {(step.committeeActions ?? []).filter((a) => a.decision === "APPROVED").length}
                        /{step.committeeMembers.length}
                      </span>
                      {" "}ท่าน
                    </p>
                    {step.committeeMembers.map((memberId) => {
                      const member = users.find((u) => u.id === memberId);
                      const action = (step.committeeActions ?? []).find((a) => a.userId === memberId);
                      const signed   = action?.decision === "APPROVED";
                      const rejected = action?.decision === "REJECTED";
                      return (
                        <div key={memberId} className="flex items-center gap-2 text-xs">
                          {signed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : rejected ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          )}
                          <span className={cn(
                            signed ? "text-green-700 font-medium" :
                            rejected ? "text-red-700 font-medium" :
                            "text-gray-400"
                          )}>
                            {member?.name ?? memberId}
                          </span>
                          {action?.actedAt && (
                            <span className="text-gray-400">· {formatDate(action.actedAt)}</span>
                          )}
                          {!action && (
                            <span className="text-gray-300 italic">ยังไม่ได้ลงนาม</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
    </>
  );
}
