import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile, BUCKET } from "@/lib/supabase";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ uploadId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadId } = await params;
  const upload = await prisma.formUpload.findUnique({ where: { id: uploadId } });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id: userId, role } = session.user;
  const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(role);
  if (!isPrivileged && upload.uploadedById !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (upload.fileUrl) {
    try {
      const url = new URL(upload.fileUrl);
      const prefix = `/storage/v1/object/public/${BUCKET}/`;
      const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : null;
      if (path) await deleteFile(path);
    } catch { /* ignore storage errors — still delete DB record */ }
  }

  await prisma.formUpload.delete({ where: { id: uploadId } });
  return NextResponse.json({ ok: true });
}
