"use client";

import { MockWorkflowStep } from "@/types";
import { ROLE_LABELS, STEP_NAMES, formatDate } from "@/lib/utils";
import { StepStatusBadge } from "./StatusBadge";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";

function StepIcon({ status }: { status: MockWorkflowStep["status"] }) {
  if (status === "APPROVED") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "REJECTED") return <XCircle className="w-5 h-5 text-red-500" />;
  if (status === "PENDING") return <Clock className="w-5 h-5 text-yellow-500" />;
  return <Circle className="w-5 h-5 text-gray-300" />;
}

export function WorkflowTimeline({ steps }: { steps: MockWorkflowStep[] }) {
  return (
    <ol className="relative border-l-2 border-gray-100 ml-2.5 space-y-6">
      {steps.map((step) => (
        <li key={step.id} className="ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-white rounded-full ring-2 ring-gray-100">
            <StepIcon status={step.status} />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">ขั้นที่ {step.stepOrder}</span>
            <span className="text-sm font-semibold text-gray-800">
              {STEP_NAMES[step.stepOrder] ?? ROLE_LABELS[step.role]}
            </span>
            <StepStatusBadge status={step.status} />
          </div>
          {step.actedByName && (
            <p className="text-xs text-gray-400 mt-0.5">
              {step.actedByName}
              {step.actedAt && ` · ${formatDate(step.actedAt)}`}
            </p>
          )}
          {step.notes && (
            <p className="mt-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              {step.notes}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
