"use client";
import { useParams } from "next/navigation";
import { RoleSubmissionDetail } from "@/components/RoleSubmissionDetail";

export default function AdvisorDetail() {
  const { id } = useParams<{ id: string }>();
  return <RoleSubmissionDetail submissionId={id} backPath="/dashboard/advisor" />;
}
