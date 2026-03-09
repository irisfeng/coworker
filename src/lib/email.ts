import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  return new Resend(apiKey);
}

function getFromAddress() {
  return process.env.AUTH_EMAIL_FROM || process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || "CoWorker <onboarding@resend.dev>";
}

export async function sendAuthCodeEmail(email: string, code: string) {
  const resend = getResendClient();
  const response = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: "CoWorker 登录验证码",
    text: `你的 CoWorker 登录验证码是 ${code}，5 分钟内有效。`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf9f7; padding: 24px; color: #3d3832;">
        <div style="max-width: 420px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e4dd; border-radius: 16px; padding: 24px;">
          <div style="font-size: 20px; font-weight: 600;">CoWorker</div>
          <p style="margin: 16px 0 8px; font-size: 14px; line-height: 1.6;">你的登录验证码如下，5 分钟内有效：</p>
          <div style="margin: 16px 0; font-size: 28px; letter-spacing: 8px; font-weight: 700; color: #c96442;">${code}</div>
          <p style="margin: 0; font-size: 12px; color: #7a7164;">如果这不是你的操作，可以忽略这封邮件。</p>
        </div>
      </div>
    `,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
}
