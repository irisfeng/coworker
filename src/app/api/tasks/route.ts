import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["high", "mid", "low"]).default("mid"),
  collaborator: z.string().optional(),
  project_tag: z.string().optional(),
  raw_input: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["high", "mid", "low"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  collaborator: z.string().optional(),
  project_tag: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const due = searchParams.get("due");

  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status as "todo" | "in_progress" | "done"));
  if (priority) conditions.push(eq(tasks.priority, priority as "high" | "mid" | "low"));
  if (due === "today") {
    const today = dayjs().format("YYYY-MM-DD");
    conditions.push(eq(tasks.due_date, today));
  } else if (due === "overdue") {
    const today = dayjs().format("YYYY-MM-DD");
    conditions.push(lte(tasks.due_date, today));
  }

  const result = conditions.length > 0
    ? await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.created_at))
    : await db.select().from(tasks).orderBy(desc(tasks.created_at));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = {
    id: uuidv4(),
    ...parsed.data,
    created_at: dayjs().toISOString(),
  };

  await db.insert(tasks).values(task);
  return NextResponse.json(task, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const updateData: Record<string, string | undefined> = { ...updates };

  if (updates.status === "done") {
    updateData.completed_at = dayjs().toISOString();
  }

  await db.update(tasks).set(updateData).where(eq(tasks.id, id));
  const updated = await db.select().from(tasks).where(eq(tasks.id, id));
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ ok: true });
}
