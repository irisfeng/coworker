# CoWorker — AI智能任务管理系统

## Context

Tony是交付中心负责人，售前/售中/售后事务繁杂，需要一个极简的AI助手来：用自然语言（文字或语音）记录任务，AI自动提取结构化信息，到期提醒，自动生成工作报告。核心价值：**转写准、提炼准、总结精炼**。

## 技术选型

- **框架**: Next.js (App Router) + Tailwind CSS
- **数据库**: 开发用SQLite (better-sqlite3)，生产用Turso (libsql)
- **AI文本**: 同时支持 Qwen3.5-Plus 和 DeepSeek-V3.2，通过环境变量切换
  - 两者均兼容 OpenAI SDK，切换只需改 baseURL + apiKey
  - 默认 Qwen（与ASR同平台），可随时切到 DeepSeek
- **ASR**: 阿里云DashScope Qwen3-ASR-Flash-Realtime
- **部署**: Vercel
- **ORM**: Drizzle ORM

## 页面结构（仅3页）

1. **首页** — 今日待办 + 过期任务 + 底部快速输入（文字/语音）
2. **任务列表** — 全部任务，按状态/优先级/项目筛选
3. **报告** — 生成日报/周报/项目报告

底部Tab导航切换，无多余页面。

## 数据模型

`src/lib/schema.ts` — tasks表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | UUID |
| title | text | 任务标题 |
| description | text? | 详情 |
| due_date | text? | 截止日期 ISO |
| priority | enum | high/mid/low |
| status | enum | todo/in_progress/done |
| collaborator | text? | 相关人（纯文本记录） |
| project_tag | text? | 项目标签 |
| raw_input | text? | 原始输入（语音转写/文字） |
| created_at | text | 创建时间 |
| completed_at | text? | 完成时间 |

## 实施阶段

### Phase 1: 项目初始化 + 数据库
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router)
- 安装依赖: `drizzle-orm`, `better-sqlite3`, `openai`, `dayjs`, `zod`
- 定义schema，生成migration，连接数据库
- 关键文件: `src/lib/schema.ts`, `src/lib/db.ts`, `drizzle.config.ts`

### Phase 2: 任务CRUD API + 基础UI
- `src/app/api/tasks/route.ts` — GET/POST/PUT/DELETE
- 用zod做请求校验
- 基础TaskCard组件（优先级色条 + 标题 + 截止日期 + 状态切换）
- 首页Today视图 + 任务列表页
- 底部Tab导航

### Phase 3: AI任务提取（核心功能）
- `src/lib/ai.ts` — AI客户端（openai SDK，支持Qwen/DeepSeek切换）
- `src/app/api/ai/extract/route.ts` — 自然语言→结构化任务JSON
- 关键prompt设计：提取标题、截止日期、优先级、相关人、项目
- 使用 `response_format: { type: "json_object" }` 确保输出可靠
- QuickInput组件：输入→AI解析→预览确认→保存

### Phase 4: 语音输入
- `src/hooks/useVoice.ts` — 浏览器AudioContext录制PCM音频
- `src/app/api/asr/route.ts` — 服务端代理，WebSocket连接Qwen3 ASR
  - URL: `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3-asr-flash-realtime`
  - 音频格式: PCM 16-bit 16kHz
- 录音按钮：按住录音→松开→转写→自动送入AI提取

### Phase 5: 报告生成
- `src/app/api/ai/report/route.ts` — 查询任务数据→AI生成报告
- 支持日报、周报、项目报告
- 报告内容：已完成/进行中/待办/协作方/总结
- 中文输出，简洁专业
- 报告页支持复制文本

### Phase 6: 应用内提醒
- `src/hooks/useReminders.ts` — 客户端每60秒轮询
- 今日到期和过期未完成的任务在首页醒目展示
- 页面顶部toast提醒

### Phase 7: 部署
- SQLite切换为Turso (`@libsql/client`)，schema不变
- 环境变量:
  - `DASHSCOPE_API_KEY` — Qwen AI + ASR
  - `DEEPSEEK_API_KEY` — DeepSeek AI
  - `AI_PROVIDER=qwen|deepseek` — 切换AI供应商
  - `DATABASE_URL`, `DATABASE_AUTH_TOKEN` — 数据库
- Vercel零配置部署

## 项目结构

```
docs/
├── plan.md                  # 本规划文档
└── plans/                   # 设计文档存放

memory/
├── 2026-03-09.md            # 每日开发记录，按日期命名
└── ...

src/
├── app/
│   ├── layout.tsx            # 根布局，移动端viewport
│   ├── page.tsx              # 首页：今日视图+快速输入
│   ├── tasks/page.tsx        # 任务列表
│   ├── reports/page.tsx      # 报告页
│   └── api/
│       ├── tasks/route.ts    # 任务CRUD
│       ├── ai/extract/route.ts  # AI任务提取
│       ├── ai/report/route.ts   # AI报告生成
│       └── asr/route.ts     # 语音转写代理
├── components/
│   ├── QuickInput.tsx        # 文字+语音输入
│   ├── TaskCard.tsx          # 任务卡片
│   ├── VoiceButton.tsx       # 录音按钮
│   └── ReportView.tsx        # 报告展示
├── hooks/
│   ├── useVoice.ts           # 录音hook
│   └── useReminders.ts       # 提醒hook
└── lib/
    ├── db.ts                 # 数据库连接
    ├── schema.ts             # 数据表定义
    └── ai.ts                 # AI客户端+prompt（Qwen/DeepSeek可切换）
```

## 注意事项

- **iOS Safari兼容**: MediaRecorder在iOS上需fallback到audio/mp4格式
- **AI JSON可靠性**: 用json_object模式 + try-catch兜底
- **音频格式**: 浏览器端用AudioContext直接采集PCM，避免服务端转码
- **Vercel冷启动**: 首次请求约1-2秒延迟，单用户场景可接受

## 验证方式

1. 本地 `npm run dev`，手机通过局域网访问测试移动端体验
2. 文字输入"下周三之前给客户A交方案"→验证AI提取出正确的任务/日期/相关方
3. 语音录入一段话→验证转写准确+任务提取正确
4. 创建一周的任务→生成周报→验证报告质量
5. 部署到Vercel→手机浏览器访问验证全流程
