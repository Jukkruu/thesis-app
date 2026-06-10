import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }
  const resend = new Resend(apiKey);

  const body = await req.json() as {
    advisorName: string;
    advisorEmail: string;
    studentName: string;
    studentCode: string;
    program: string;
    thesisTitle: string;
    submissionId: string;
  };

  const { advisorName, advisorEmail, studentName, studentCode, program, thesisTitle } = body;

  console.log("[email/advisor] Sending to:", advisorEmail);

  const { data, error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [advisorEmail],
    subject: `[แจ้งอาจารย์ที่ปรึกษา] ถึงคิวลงนาม — ${thesisTitle}`,
    html: `
      <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #9333ea); border-radius: 12px; padding: 24px; color: white; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 20px;">👨‍🏫 แจ้งอาจารย์ที่ปรึกษา — ถึงคิวลงนาม</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
        </div>

        <p style="color: #374151; font-size: 16px;">เรียน ${advisorName},</p>
        <p style="color: #374151;">วิทยานิพนธ์ของนิสิตในความดูแลของท่านผ่านขั้นตอนก่อนหน้าแล้ว กรุณาเข้าสู่ระบบเพื่อตรวจสอบและลงนาม</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px 14px; font-weight: 600; color: #6b7280; width: 40%;">ชื่อนิสิต</td>
            <td style="padding: 10px 14px; color: #111827;">${studentName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #6b7280;">รหัสนิสิต</td>
            <td style="padding: 10px 14px; color: #111827;">${studentCode}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px 14px; font-weight: 600; color: #6b7280;">หลักสูตร</td>
            <td style="padding: 10px 14px; color: #111827;">${program}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #6b7280;">ชื่อหัวข้อวิทยานิพนธ์</td>
            <td style="padding: 10px 14px; color: #111827;">${thesisTitle}</td>
          </tr>
        </table>

        <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0;">
          <p style="margin: 0; color: #5b21b6; font-size: 14px; font-weight: 600;">กรุณาเข้าสู่ระบบเพื่อลงนาม</p>
          <p style="margin: 6px 0 0; color: #6d28d9; font-size: 13px;">ขั้นตอน: อาจารย์ที่ปรึกษาลงนาม บ.3</p>
        </div>

        <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
          อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
          กรุณาอย่าตอบกลับอีเมลนี้
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email/advisor] Resend error:", JSON.stringify(error));
    return NextResponse.json({ error }, { status: 500 });
  }

  console.log("[email/advisor] Sent OK, id:", data?.id);
  return NextResponse.json({ id: data?.id });
}
