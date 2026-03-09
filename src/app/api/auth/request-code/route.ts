import { randomInt, randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashAuthCode, isValidEmail, normalizeEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendAuthCodeEmail } from "@/lib/email";
import { authCodes } from "@/lib/schema";

const RequestCodeSchema = z.object({
  email: z.string(),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function generateAuthCode() {
  return String(randomInt(100000, 1000000));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "请求格式错误");
  }

  const parsed = RequestCodeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_EMAIL", "请输入正确的邮箱");
  }

  const email = normalizeEmail(parsed.data.email);
  if (!isValidEmail(email)) {
    return errorResponse(400, "INVALID_EMAIL", "请输入正确的邮箱");
  }

  const db = await getDb();
  const [latestCode] = await db
    .select()
    .from(authCodes)
    .where(eq(authCodes.email, email))
    .orderBy(desc(authCodes.created_at))
    .limit(1);

  if (latestCode && Date.now() - Date.parse(latestCode.created_at) < 60_000) {
    return errorResponse(429, "RATE_LIMITED", "同一邮箱 60 秒内只能发送一次验证码");
  }

  const code = generateAuthCode();
  const now = new Date();
  const authCodeId = randomUUID();

  await db.insert(authCodes).values({
    id: authCodeId,
    email,
    code_hash: hashAuthCode(code),
    expires_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    consumed_at: null,
    attempts: 0,
    created_at: now.toISOString(),
  });

  try {
    await sendAuthCodeEmail(email, code);
  } catch (error) {
    await db.delete(authCodes).where(eq(authCodes.id, authCodeId));
    console.error("[auth.request-code] send email failed", error);
    return errorResponse(500, "EMAIL_SEND_FAILED", "验证码发送失败，请稍后重试");
  }

  return NextResponse.json({ ok: true });
}
