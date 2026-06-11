import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, BUCKET } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const submissionId = formData.get("submissionId") as string;
  const formType = formData.get("formType") as string;

  if (!file || !submissionId || !formType)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const path = `${submissionId}/${formType}_${Date.now()}_${file.name}`;
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
      fileName: file.name,
      fileSize: file.size,
      fileUrl: fileUrl ?? null,
      submissionId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ ...upload, uploadedAt: upload.uploadedAt.toISOString() });
}
