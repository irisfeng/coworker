"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const EMAIL_OTP_PROVIDER_ID = "email-otp";

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return null;
}

function LoginCard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col justify-center">
        <div className="rounded-[28px] border border-warm-200/70 bg-white px-6 py-7 shadow-[0_24px_60px_rgba(61,56,50,0.08)]">
          <div className="mb-8">
            <div className="inline-flex rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
              CoWorker
            </div>
            <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-warm-900">邮箱验证码登录</h1>
            <p className="mt-2 text-sm leading-6 text-warm-500">输入工作邮箱，获取 6 位验证码后即可登录。</p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isSending, startSending] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = (() => {
    const value = searchParams.get("callbackUrl");
    return value && value.startsWith("/") ? value : "/";
  })();

  const handleRequestCode = () => {
    startSending(async () => {
      setError("");
      setMessage("");

      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload) || "验证码发送失败，请稍后重试");
        return;
      }

      setMessage("验证码已发送到邮箱，5 分钟内有效。");
      setCooldown(60);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSubmitting(async () => {
      setError("");
      setMessage("");

      const result = await signIn(EMAIL_OTP_PROVIDER_ID, {
        email: normalizedEmail,
        code,
        redirect: false,
        redirectTo,
      });

      if (!result || result.error) {
        setError("验证码错误或已过期");
        return;
      }

      router.replace(result.url || redirectTo);
      router.refresh();
    });
  };

  const canRequestCode = normalizedEmail.length > 0 && cooldown === 0 && !isSending;
  const canSubmit = normalizedEmail.length > 0 && code.length === 6 && !isSubmitting;

  return (
    <LoginCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-warm-500">邮箱</span>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-2xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:bg-white"
            />
            <button
              type="button"
              onClick={handleRequestCode}
              disabled={!canRequestCode}
              className="shrink-0 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-sm transition-opacity disabled:opacity-40"
            >
              {isSending ? "发送中" : cooldown > 0 ? `${cooldown}s` : "发验证码"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-warm-500">验证码</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="输入 6 位验证码"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-2xl border border-warm-200 bg-warm-50 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none transition-colors focus:border-accent focus:bg-white"
          />
        </label>

        {(message || error) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              error ? "bg-danger-light text-danger" : "bg-accent-light text-accent"
            }`}
          >
            {error || message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-warm-900 px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-warm-400">
        未收到邮件时请检查垃圾箱，或 60 秒后重新发送。
      </p>
    </LoginCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginCard>
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-warm-300 border-t-accent" />
          </div>
        </LoginCard>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
