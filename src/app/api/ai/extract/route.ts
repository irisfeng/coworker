import { NextRequest, NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";
import dayjs from "dayjs";

function previewText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function looksLikeTask(text: string) {
  return /(明天|后天|今天|下周|周[一二三四五六日天]|月底|之前|以后|安排|处理|提交|发送|发给|联系|跟进|确认|完成|准备|整理|回复|提醒|同步|开会|计划|修复|上线|部署|review|follow up|todo|待办)/i.test(
    text
  );
}

function looksLikeChitChat(text: string) {
  return /^(你好|您好|嗨|哈喽|早上好|中午好|下午好|晚上好|在吗|谢谢|哈哈|hi|hello)\b/i.test(text.trim());
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const today = dayjs().format("YYYY-MM-DD");
    console.info(`[AI extract:${requestId}] start`, {
      model: AI_MODEL,
      inputLength: text.length,
      preview: previewText(text),
    });

    const response = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `你是一个任务提取助手，从用户的自然语言里提取待办事项。
今天是 ${today}。

只返回 JSON，格式如下：
{
  "tasks": [
    {
      "title": "简洁的任务标题，20字以内",
      "description": "更详细的补充说明，没有则为 null",
      "due_date": "YYYY-MM-DD，没有明确日期则为 null",
      "priority": "high | mid | low",
      "collaborator": "相关人员，没有则为 null",
      "project_tag": "项目或主题标签，没有则为 null"
    }
  ]
}

规则：
1. 用户输入里可能有 0 个、1 个或多个任务，要全部提取。
2. 明确的闲聊、寒暄、感叹、没有行动要求的陈述，返回 {"tasks":[]}。
3. “明天”“后天”“下周一”“月底”等相对时间要换算成具体日期。
4. 提到“紧急”“马上”“立刻”“ASAP”“加急”等，priority 设为 high；默认 mid。
5. 标题要保留动作和对象，例如“明天下午三点前把合同发给王总”可提炼成“给王总发合同”。
6. 不能确定的信息填 null。
7. 不要输出 Markdown，不要解释，不要输出 JSON 以外的任何内容。`,
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    let tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

    if (tasks.length === 0 && looksLikeTask(text) && !looksLikeChitChat(text)) {
      tasks = [{ title: text }];
    }

    console.info(`[AI extract:${requestId}] success`, {
      taskCount: tasks.length,
      fallback: tasks.length === 1 && tasks[0]?.title === text,
      preview: previewText(content),
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(`[AI extract:${requestId}] failed`, error);
    return NextResponse.json({ tasks: [{ title: text }] });
  }
}
