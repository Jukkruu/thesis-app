import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, BUCKET } from "@/lib/supabase";
import { FORM_SHORT } from "@/lib/utils";
import type { FormType } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const submissionId = formData.get("submissionId") as string;
  const formType = formData.get("formType") as string;

  if (!file || !submissionId || !formType)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // SIGNED uploads (committee's own signed copies) keep their original filename — it's already descriptive.
  // All other form types get renamed: e.g. "บ.วศ.1ก_6300001.pdf"
  let displayFileName: string;
  if (formType === "SIGNED") {
    displayFileName = file.name;
  } else {
    const sub = await prisma.submission.findUnique({ where: { id: submissionId }, select: { studentCode: true } });
    const shortLabel = FORM_SHORT[formType as FormType] ?? formType;
    displayFileName = sub?.studentCode
      ? `${shortLabel}_${sub.studentCode}.pdf`
      : `${shortLabel}.pdf`;
  }

  const path = `${submissionId}/${formType}_${Date.now()}.pdf`;
  let fileUrl: string | undefined;

  try {
    await uploadFile(file, path);
    fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch {
    // Store without URL if Supabase storage not configured yet
  }

  const upload = await prisma.formUpload.create({
    data: {
      formType: formType as any,
      fileName: displayFileName,
      fileSize: file.size,
      fileUrl: fileUrl ?? null,
      submissionId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ ...upload, uploadedAt: upload.uploadedAt.toISOString() });
}
