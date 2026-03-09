import { createHash, randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authCodes, users } from "@/lib/schema";

export const EMAIL_OTP_PROVIDER_ID = "email-otp";
export const AUTH_CODE_TTL_MS = 5 * 60 * 1000;

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeOtpCode(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function hashAuthCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: EMAIL_OTP_PROVIDER_ID,
      name: "邮箱验证码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        const db = await getDb();
        const email = normalizeEmail(credentials?.email);
        const code = normalizeOtpCode(credentials?.code);

        if (!isValidEmail(email) || code.length !== 6) {
          return null;
        }

        const [latestCode] = await db
          .select()
          .from(authCodes)
          .where(and(eq(authCodes.email, email), isNull(authCodes.consumed_at)))
          .orderBy(desc(authCodes.created_at))
          .limit(1);

        if (!latestCode) {
          return null;
        }

        const now = new Date().toISOString();
        if (latestCode.expires_at <= now) {
          return null;
        }

        if (latestCode.code_hash !== hashAuthCode(code)) {
          await db
            .update(authCodes)
            .set({ attempts: latestCode.attempts + 1 })
            .where(eq(authCodes.id, latestCode.id));
          return null;
        }

        let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (user?.status === "disabled") {
          return null;
        }

        if (!user) {
          user = {
            id: randomUUID(),
            email,
            display_name: null,
            status: "active",
            created_at: now,
            updated_at: now,
            last_login_at: now,
          };
          await db.insert(users).values(user);
        } else {
          await db
            .update(users)
            .set({
              updated_at: now,
              last_login_at: now,
            })
            .where(eq(users.id, user.id));

          user = {
            ...user,
            updated_at: now,
            last_login_at: now,
          };
        }

        await db.update(authCodes).set({ consumed_at: now }).where(eq(authCodes.id, latestCode.id));

        return {
          id: user.id,
          email: user.email,
          name: user.display_name ?? user.email.split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      return session;
    },
  },
});
