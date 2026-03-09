import { NextRequest, NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";
import dayjs from "dayjs";

const ACTION_KEYWORDS = [
  "安排",
  "处理",
  "提交",
  "发送",
  "发给",
  "联系",
  "跟进",
  "确认",
  "完成",
  "准备",
  "整理",
  "回复",
  "提醒",
  "同步",
  "计划",
  "修复",
  "上线",
  "部署",
  "review",
  "follow up",
  "todo",
  "待办",
];

const EVENT_KEYWORDS = [
  "参加",
  "出席",
  "开会",
  "会议",
  "例会",
  "晨会",
  "周会",
  "月会",
  "评审会",
  "见客户",
  "拜访",
  "约见",
  "接待",
  "对接",
  "沟通",
  "培训",
  "学习",
  "参观",
  "考察",
  "交流",
  "路演",
  "面试",
  "答辩",
  "演示",
  "汇报",
  "出差",
  "调研",
];

const TIME_KEYWORDS = [
  "今天",
  "明天",
  "后天",
  "今晚",
  "本周",
  "下周",
  "下个月",
  "月底",
  "月初",
  "周一",
  "周二",
  "周三",
  "周四",
  "周五",
  "周六",
  "周日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期天",
  "上午",
  "下午",
  "晚上",
  "之前",
  "以后",
];

const NEGATIVE_PREFIXES = [
  "不想", "不用", "不需要", "不必", "别", "没有", "没去", "没参加",
  "取消", "推迟", "延期", "已经",
  "已完成", "已提交", "已发送", "已处理", "已搞定",
  "做完了", "交了", "发了",
  "不去", "不参加", "不开", "不出席",
];

const PAST_TENSE_PATTERNS = [
  /已经.{0,8}(完成|提交|发送|处理|搞定|做完)/,
  /.{0,6}(完成了|提交了|发送了|处理了|搞定了|做完了|交了|发了|开完了)/,
  /昨天.{0,12}(开会|培训|汇报|出差|参加|拜访)/,
];

const CHITCHAT_PATTERNS = [
  /^(你好|您好|嗨|哈喽|hi|hello)[!！,.，。]*$/i,
  /^(早上好|中午好|下午好|晚上好)[!！,.，。]*$/i,
  /^(在吗|谢谢|多谢|哈哈|哈|嗯嗯|哦哦)[!！,.，。]*$/i,
];

function previewText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function looksLikeNegated(text: string) {
  const normalized = normalizeText(text);
  // 否定前缀 + 动作/事件关键词 → 不是任务
  const allKeywords = [...ACTION_KEYWORDS, ...EVENT_KEYWORDS];
  if (NEGATIVE_PREFIXES.some(neg => allKeywords.some(kw => normalized.includes(neg + kw)))) return true;
  // 已完成的回顾性陈述
  if (PAST_TENSE_PATTERNS.some(p => p.test(normalized))) return true;
  return false;
}

function looksLikeTask(text: string) {
  const normalized = normalizeText(text);

  // 先排除否定/回顾性表述
  if (looksLikeNegated(normalized)) return false;

  const hasAction = containsAny(normalized, ACTION_KEYWORDS);
  const hasEvent = containsAny(normalized, EVENT_KEYWORDS);
  const hasTime = containsAny(normalized, TIME_KEYWORDS) || /\d{1,2}[点:：]\d{0,2}/.test(normalized);
  const hasParticipant = /(客户|老板|总|老师|同事|团队|供应商|合作方|甲方|乙方|领导)/.test(normalized);
  const hasDestination = /(去|到|前往).{0,12}(学习|参观|考察|开会|培训|拜访)/.test(normalized);

  return hasAction || hasEvent || (hasTime && hasEvent) || (hasEvent && hasParticipant) || hasDestination;
}

function looksLikeChitChat(text: string) {
  const normalized = normalizeText(text);
  if (looksLikeTask(normalized)) {
    return false;
  }

  return CHITCHAT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function fallbackTasks(text: string) {
  if (looksLikeTask(text) && !looksLikeChitChat(text)) {
    return [{ title: normalizeText(text) }];
  }

  return [];
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
          content: `你是一个任务提取助手，从用户输入中提取待办事项。
今天是 ${today}。

只返回 JSON，格式如下：
{
  "tasks": [
    {
      "title": "简洁的任务标题，20字以内",
      "description": "补充说明，没有则为 null",
      "due_date": "YYYY-MM-DD；如果明确提到时间，则用 YYYY-MM-DD HH:mm；没有明确日期则为 null",
      "priority": "high | mid | low",
      "collaborator": "相关人员，没有则为 null",
      "project_tag": "项目或主题标签，没有则为 null"
    }
  ]
}

规则：
1. 只要用户表达了需要执行、参加、出席、拜访、见面、学习、参观、培训、沟通、汇报、出差、调研、对接等事项，都算待办。
2. 日程型事项也算待办，即使句子像陈述句，例如“周三参加客户会”“明天去园区参观学习”“下午见张总”都必须提取。
3. 明确的闲聊、寒暄、感叹、没有行动要求或安排含义的内容，才返回 {"tasks":[]}。
4. 一段输入可能包含 0 个、1 个或多个任务，要全部提取。
5. “明天”“后天”“下周一”“月底”等相对时间要换算成具体日期。
6. 如果提到具体时间，例如“今晚8点”“明天下午3点30”“上午10点”，要把时间也写进 due_date，格式为 YYYY-MM-DD HH:mm。
7. 提到“紧急”“马上”“立刻”“ASAP”“加急”等，priority 设为 high；默认 mid。
8. 标题优先保留动作和对象，例如”明天下午三点前把合同发给王总”提炼成”给王总发合同”，”周五参加客户交流会”提炼成”参加客户交流会”。
9. 不能确定的信息填 null。
10. 不要输出 Markdown，不要解释，不要输出 JSON 以外的任何内容。
11. 否定、拒绝、回顾性内容不是待办，必须返回空：
    - “我不想参加周五的培训” → 拒绝，不是待办
    - “今天会议开得不错” → 回顾/感想，不是待办
    - “已经把报告交给王总了” → 已完成，不是新待办
    - “王总说下周可能要出差” → 不确定的传闻，不是待办
    - “取消明天的会议” → 取消动作，不是待办
12. 口语化连续输入可能用”对了””还有””另外”串联多个任务，要全部拆分提取。`,
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    let tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

    if (tasks.length === 0) {
      tasks = fallbackTasks(text);
    }

    console.info(`[AI extract:${requestId}] success`, {
      taskCount: tasks.length,
      fallback: tasks.length === 1 && tasks[0]?.title === normalizeText(text),
      preview: previewText(content),
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(`[AI extract:${requestId}] failed`, error);
    return NextResponse.json({ tasks: fallbackTasks(text) });
  }
}
