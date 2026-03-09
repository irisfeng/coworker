import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("请先登录");
    this.name = "UnauthorizedError";
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "请先登录",
      },
    },
    { status: 401 }
  );
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

export function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return unauthorizedResponse();
  }

  throw error;
}
