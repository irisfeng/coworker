import { NextRequest, NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { and, or, gte, lte, eq, lt, ne, isNull } from "drizzle-orm";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { z } from "zod";

dayjs.extend(isoWeek);

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid() && dayjs(value).format("YYYY-MM-DD") === value;
}

const ReportRequestSchema = z.object({
  type: z.enum(["daily", "weekly", "project"]),
  date: z.string().optional(),
  project: z.string().trim().min(1).max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.date !== undefined && !isValidDateString(value.date)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["date"],
      message: "date must be YYYY-MM-DD",
    });
  }
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }
  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, date, project } = parsed.data;

  let startDate: string;
  let endDate: string;
  let reportTitle: string;

  if (type === "daily") {
    startDate = date || dayjs().format("YYYY-MM-DD");
    endDate = startDate;
    reportTitle = `${startDate} 日报`;
  } else if (type === "weekly") {
    const d = dayjs(date || undefined);
    startDate = d.startOf("isoWeek").format("YYYY-MM-DD");
    endDate = d.endOf("isoWeek").format("YYYY-MM-DD");
    reportTitle = `${startDate} ~ ${endDate} 周报`;
  } else {
    startDate = "2000-01-01";
    endDate = "2099-12-31";
    reportTitle = project ? `${project} 项目报告` : "项目报告";
  }

  // 查询该时间段内：到期的任务 OR 完成的任务 OR 逾期未完成 OR 无截止日期的待办
  const timeCondition = or(
    // 到期日在时间段内
    and(gte(tasks.due_date, startDate), lte(tasks.due_date, endDate + "T23:59:59")),
    // 完成时间在时间段内
    and(gte(tasks.completed_at, startDate), lte(tasks.completed_at, endDate + "T23:59:59")),
    // 逾期未完成：到期日在时间段之前且未完成
    and(lt(tasks.due_date, startDate), ne(tasks.status, "done")),
    // 无截止日期的未完成任务（仅项目报告包含）
    ...(type === "project" ? [and(isNull(tasks.due_date), ne(tasks.status, "done"))] : [])
  );

  const conditions = [timeCondition];
  if (project) conditions.push(eq(tasks.project_tag, project));

  const taskList = await db.select().from(tasks).where(and(...conditions));

  if (taskList.length === 0) {
    return NextResponse.json({ report: "该时间段内暂无任务记录。" });
  }

  const taskSummary = taskList
    .map(
      (t) =>
        `- [${t.status}] ${t.title}${t.due_date ? ` (截止:${t.due_date})` : ""}${t.completed_at ? ` (完成:${t.completed_at.slice(0, 10)})` : ""}${t.collaborator ? ` [${t.collaborator}]` : ""}${t.project_tag ? ` #${t.project_tag}` : ""}`
    )
    .join("\n");

  try {
    const response = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `你是一个工作报告生成器。根据任务列表生成简洁专业的中文工作报告。

报告格式：
## ${reportTitle}

### 已完成
- 任务摘要

### 进行中
- 任务摘要及进展

### 待办
- 未开始的任务

### 协作方
- 涉及的人员和事项

### 总结
2-3句话概括

规则：
- 简洁专业，合并相关任务
- 突出逾期项
- 中文输出`,
        },
        { role: "user", content: `以下是任务列表：\n${taskSummary}` },
      ],
    });

    const report = response.choices[0]?.message?.content || "生成失败";
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ report: "报告生成失败，请检查AI配置。" });
  }
}
