import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { handleAuthError, requireUserId } from "@/lib/auth-api";

const NullableString = z.string().nullish().transform((value) => value ?? undefined);

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: NullableString,
  due_date: NullableString,
  priority: z.enum(["high", "mid", "low"]).default("mid"),
  collaborator: NullableString,
  project_tag: NullableString,
  raw_input: NullableString,
});
const CreateTasksSchema = z.union([CreateTaskSchema, z.array(CreateTaskSchema).min(1)]);

const UpdateTaskSchema = z.object({
  id: z.string(),
  title: NullableString,
  description: NullableString,
  due_date: NullableString,
  priority: z.enum(["high", "mid", "low"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  collaborator: NullableString,
  project_tag: NullableString,
});

export async function GET(request: NextRequest) {
  const db = await getDb();
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    return handleAuthError(error);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const due = searchParams.get("due");

  const conditions = [eq(tasks.user_id, userId)];
  if (status) conditions.push(eq(tasks.status, status as "todo" | "in_progress" | "done"));
  if (priority) conditions.push(eq(tasks.priority, priority as "high" | "mid" | "low"));
  if (due === "today") {
    const today = dayjs().format("YYYY-MM-DD");
    conditions.push(sql`substr(${tasks.due_date}, 1, 10) = ${today}`);
  } else if (due === "overdue") {
    const today = dayjs().format("YYYY-MM-DD");
    conditions.push(sql`substr(${tasks.due_date}, 1, 10) < ${today}`);
  }

  const result = conditions.length > 0
    ? await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.created_at))
    : await db.select().from(tasks).orderBy(desc(tasks.created_at));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    return handleAuthError(error);
  }

  const body = await request.json();
  const parsed = CreateTasksSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[tasks.create] validation failed", parsed.error.flatten(), body);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payloads = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const now = dayjs().toISOString();
  const createdTasks = payloads.map((payload) => ({
    id: uuidv4(),
    user_id: userId,
    ...payload,
    created_at: now,
  }));

  await db.insert(tasks).values(createdTasks);
  return NextResponse.json(Array.isArray(parsed.data) ? createdTasks : createdTasks[0], { status: 201 });
}

export async function PUT(request: NextRequest) {
  const db = await getDb();
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    return handleAuthError(error);
  }

  const body = await request.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[tasks.update] validation failed", parsed.error.flatten(), body);
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const updateData: Record<string, string | null | undefined> = { ...updates };

  if (updates.status === "done") {
    updateData.completed_at = dayjs().toISOString();
  } else if (updates.status) {
    updateData.completed_at = null;
  }

  await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, id), eq(tasks.user_id, userId)));
  const updated = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.user_id, userId)));

  if (!updated[0]) {
    return NextResponse.json({ error: "task not found" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(request: NextRequest) {
  const db = await getDb();
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    return handleAuthError(error);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.user_id, userId)));
  return NextResponse.json({ ok: true });
}
