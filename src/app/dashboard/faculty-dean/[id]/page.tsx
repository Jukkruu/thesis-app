"use client";
import { useParams } from "next/navigation";
import { RoleSubmissionDetail } from "@/components/RoleSubmissionDetail";

export default function FacultyDeanDetail() {
  const { id } = useParams<{ id: string }>();
  return <RoleSubmissionDetail submissionId={id} backPath="/dashboard/faculty-dean" />;
}
