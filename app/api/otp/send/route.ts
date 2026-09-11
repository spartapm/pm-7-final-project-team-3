import { NextResponse } from "next/server";
import { OTP_EXPIRES_SEC, OTP_SUBJECT, RESEND_FROM } from "@/lib/mail";

function otpEmail(code: string) {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>틈 - 비밀번호 재설정 인증 코드</title></head>
<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR','Malgun Gothic',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">틈 비밀번호 재설정을 위한 인증 코드입니다. 3분 내에 입력해주세요.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8fa;padding:40px 0;"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;max-width:480px;width:100%;">
<tr><td style="padding:36px 40px 0 40px;" align="left"><span style="font-size:22px;font-weight:800;color:#3182f6;letter-spacing:-0.5px;">틈</span></td></tr>
<tr><td style="padding:28px 40px 8px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#16171b;line-height:1.4;">비밀번호 재설정 인증 코드</p></td></tr>
<tr><td style="padding:0 40px 24px 40px;"><p style="margin:0;font-size:15px;color:#4b4e58;line-height:1.6;">안녕하세요, 요청하신 비밀번호 재설정을 위한 인증 코드입니다.<br />아래 6자리 코드를 앱에 입력해주세요.</p></td></tr>
<tr><td style="padding:0 40px 20px 40px;" align="center"><img src="https://myteum.vercel.app/assets/email/%EA%B6%81%EA%B8%88%ED%8B%88%EB%81%BC.png" alt="틈 마스코트" width="140" style="display:block;width:140px;max-width:140px;height:auto;" /></td></tr>
<tr><td style="padding:0 40px 8px 40px;" align="center"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f7f8fa;border-radius:16px;"><tr><td align="center" style="padding:28px 0;"><span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#16171b;font-family:'Courier New',monospace;">${code}</span></td></tr></table></td></tr>
<tr><td style="padding:12px 40px 0 40px;" align="center"><p style="margin:0;font-size:13px;color:#999ea6;">이 코드는 <strong style="color:#3182f6;">3분간</strong> 유효합니다.</p></td></tr>
<tr><td style="padding:28px 40px 0 40px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
<tr><td style="padding:20px 40px 36px 40px;"><p style="margin:0;font-size:13px;color:#999ea6;line-height:1.7;">본인이 요청하지 않았다면 이 이메일을 무시해주세요. 비밀번호는 변경되지 않습니다.<br />코드가 만료됐다면 앱에서 '코드 재전송'을 눌러 새 코드를 받을 수 있어요.</p></td></tr>
<tr><td style="padding:24px 40px 32px 40px;background-color:#fafafb;" align="center"><p style="margin:0 0 4px 0;font-size:12px;color:#b0b4bb;">새는 구독비를 잠그다 · 틈</p><p style="margin:0;font-size:12px;color:#c4c7cc;">이 메일은 발신 전용입니다. 문의는 앱 내 고객센터를 이용해주세요.</p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(req: Request) {
  const body = await req.json() as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: OTP_SUBJECT,
        html: otpEmail(code),
      }),
    });
    if (!sent.ok) return NextResponse.json({ ok: false, error: "send" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, code, expiresIn: OTP_EXPIRES_SEC, mock: !key });
}
