import { NextRequest, NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";
import dayjs from "dayjs";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  try {
    const today = dayjs().format("YYYY-MM-DD");
    const response = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `你是一个任务提取助手。从用户的自然语言输入中提取任务信息。

今天是 ${today}。

返回JSON格式：
{
  "tasks": [{
    "title": "简洁的任务标题（20字以内）",
    "description": "详细描述（可选，无则为null）",
    "due_date": "YYYY-MM-DD格式的截止日期（无则为null）",
    "priority": "high|mid|low",
    "collaborator": "相关人员（无则为null）",
    "project_tag": "项目名称（无则为null）"
  }]
}

规则：
- "明天"=明天日期，"下周一"=下周一日期，"月底"=本月最后一天
- 提到"紧急/马上/立刻/ASAP/加急"设为high
- 一段输入可能包含多个任务，全部提取
- 只返回JSON，不要其他文字`,
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI extract error:", error);
    return NextResponse.json({ tasks: [{ title: text }] });
  }
}
