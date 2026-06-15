import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FINANCE_EMAIL = process.env.FINANCE_EMAIL ?? "outanagon2549@gmail.com";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }
  const resend = new Resend(apiKey);

  const body = await req.json() as {
    studentName: string;
    studentCode: string;
    studentEmail?: string;
    studentPhone?: string;
    program: string;
    thesisTitle: string;
    submissionId: string;
    advisorName?: string;
    headCommitteeName?: string;
    committeeNames?: string[];
    invitedProfName?: string;
    invitedProfAffiliation?: string;
    examDate?: string;
    examTime?: string;
    roomNeeded?: boolean;
    parkingNeeded?: boolean;
    carPlate?: string;
  };

  const {
    studentName, studentCode, studentEmail, studentPhone,
    program, thesisTitle, submissionId,
    advisorName, headCommitteeName, committeeNames, invitedProfName, invitedProfAffiliation,
    examDate, examTime, roomNeeded, parkingNeeded, carPlate,
  } = body;

  console.log("[email/finance] Sending to:", FINANCE_EMAIL);

  const committeeRows = [
    headCommitteeName ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ประธานกรรมการสอบ</td><td style="padding:10px 14px;color:#111827;">${headCommitteeName}</td></tr>` : "",
    ...(committeeNames ?? []).map((name, i) =>
      `<tr style="${i % 2 === 0 ? "background:#f9fafb;" : ""}"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">กรรมการสอบ ${i + 1}</td><td style="padding:10px 14px;color:#111827;">${name}</td></tr>`
    ),
    invitedProfName ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;">กรรมการภายนอก</td><td style="padding:10px 14px;color:#111827;">${invitedProfName}${invitedProfAffiliation ? ` (${invitedProfAffiliation})` : ""}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  const { data, error } = await resend.emails.send({
    from: "ระบบวิทยานิพนธ์ ME CU <onboarding@resend.dev>",
    to: [FINANCE_EMAIL],
    subject: `[แจ้งการเงิน] นิสิตยื่นเสนอหัวข้อวิทยานิพนธ์ — ${studentName}`,
    html: `
      <div style="font-family:'Sarabun',sans-serif;max-width:640px;margin:0 auto;padding:24px;">
        <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:24px;color:white;margin-bottom:24px;">
          <h1 style="margin:0;font-size:20px;">📧 แจ้งการเงิน — วิทยานิพนธ์ผ่านขั้นตอนที่ 1</h1>
          <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">ภาควิชาวิศวกรรมเครื่องกล คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย</p>
        </div>

        <p style="color:#374151;font-size:16px;">เรียน ฝ่ายการเงิน,</p>
        <p style="color:#374151;">นิสิตรายการด้านล่างได้ยื่นเสนอหัวข้อวิทยานิพนธ์และผ่านการอนุมัติขั้นตอนที่ 1 เรียบร้อยแล้ว กรุณาดำเนินการในส่วนที่เกี่ยวข้อง</p>

        <!-- Student info -->
        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">ข้อมูลนิสิต</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">ชื่อ-นามสกุล</td>
            <td style="padding:10px 14px;color:#111827;">${studentName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">รหัสนิสิต</td>
            <td style="padding:10px 14px;color:#111827;">${studentCode}</td>
          </tr>
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">หลักสูตร</td>
            <td style="padding:10px 14px;color:#111827;">${program}</td>
          </tr>
          ${studentEmail ? `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;">อีเมล</td><td style="padding:10px 14px;color:#111827;">${studentEmail}</td></tr>` : ""}
          ${studentPhone ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">เบอร์โทร</td><td style="padding:10px 14px;color:#111827;">${studentPhone}</td></tr>` : ""}
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#6b7280;">ชื่อวิทยานิพนธ์</td>
            <td style="padding:10px 14px;color:#111827;">${thesisTitle}</td>
          </tr>
        </table>

        <!-- Committee & Advisor -->
        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">อาจารย์ที่ปรึกษาและกรรมการสอบ</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${advisorName ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">อาจารย์ที่ปรึกษา</td><td style="padding:10px 14px;color:#111827;">${advisorName}</td></tr>` : ""}
          ${committeeRows}
        </table>

        <!-- Exam info -->
        <p style="font-weight:700;color:#1e40af;font-size:14px;margin:20px 0 8px;">ข้อมูลการสอบ</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${examDate ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:40%;">วันที่สอบ</td><td style="padding:10px 14px;color:#111827;">${examDate}${examTime ? ` เวลา ${examTime} น.` : ""}</td></tr>` : ""}
          <tr${examDate ? "" : ' style="background:#f3f4f6;"'}><td style="padding:10px 14px;font-weight:600;color:#6b7280;">ห้องประชุม</td><td style="padding:10px 14px;color:#111827;">${roomNeeded ? "✅ ต้องการห้องประชุม" : "ไม่ต้องการ"}</td></tr>
          ${parkingNeeded ? `<tr style="background:#f3f4f6;"><td style="padding:10px 14px;font-weight:600;color:#6b7280;">ที่จอดรถ (ทะเบียน)</td><td style="padding:10px 14px;color:#111827;">${carPlate ?? "-"}</td></tr>` : ""}
        </table>

        <p style="color:#6b7280;font-size:12px;margin-top:8px;">รหัสคำร้อง: ${submissionId}</p>

        <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;">
          อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบจัดการวิทยานิพนธ์ ภาควิชาวิศวกรรมเครื่องกล จุฬาฯ<br>
          กรุณาอย่าตอบกลับอีเมลนี้
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[email/finance] Resend error:", JSON.stringify(error));
    return NextResponse.json({ error }, { status: 500 });
  }

  console.log("[email/finance] Sent OK, id:", data?.id);
  return NextResponse.json({ id: data?.id });
}
