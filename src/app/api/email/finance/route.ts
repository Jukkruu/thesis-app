import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendFinanceEmail, type FinanceEmailData } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.RESEND_API_KEY)
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });

  const body = await req.json() as FinanceEmailData;

  try {
    await sendFinanceEmail(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[email/finance] route error:", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
