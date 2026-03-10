# CoWorker

AI 智能任务管理移动端 Web App。用自然语言（文字/语音）记录任务，AI 自动提取结构化信息，到期提醒，自动生成工作报告。

## 功能

- **自然语言输入** — 文字或语音录入，AI 自动提取标题、截止时间、优先级、协作人、项目标签
- **语音转写** — 阿里云 Qwen3-ASR 实时转写，说完自动送入 AI 提取
- **任务管理** — 今日视图、全部任务列表、按状态/优先级/截止日期筛选排序
- **报告生成** — 日报/周报/项目报告，AI 自动汇总任务完成情况
- **邮箱登录** — 邮箱验证码登录（注册登录合一），多用户数据隔离
- **应用内提醒** — 逾期/今日到期任务高亮提示

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router) + Tailwind CSS |
| 数据库 | SQLite (开发) / Turso (生产)，Drizzle ORM |
| AI | Qwen3.5-Plus / DeepSeek-V3.2（可切换） |
| ASR | 阿里云 Qwen3-ASR-Flash-Realtime |
| 鉴权 | Auth.js v5 + JWT + 邮箱验证码 (Resend) |
| 部署 | Vercel |

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的 key

# 运行数据库迁移
npx drizzle-kit generate
npx drizzle-kit migrate

# 启动开发服务器
npm run dev
```

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `AI_PROVIDER` | AI 供应商 (`qwen` 或 `deepseek`) | 是 |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope Key（Qwen AI + ASR） | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 选填 |
| `AUTH_SECRET` | Auth.js JWT 密钥（`npx auth secret` 生成） | 是 |
| `RESEND_API_KEY` | Resend 邮件服务 Key | 是 |
| `AUTH_EMAIL_FROM` | 发件人地址（需绑定域名） | 选填 |
| `TURSO_DATABASE_URL` | Turso 数据库 URL（生产） | 生产必填 |
| `TURSO_AUTH_TOKEN` | Turso 认证 Token（生产） | 生产必填 |

## 项目结构

```
src/
├── app/
│   ├── (protected)/        # 需登录的页面
│   │   ├── page.tsx        # 今日视图
│   │   ├── tasks/          # 全部任务
│   │   └── reports/        # 报告生成
│   ├── login/              # 登录页
│   └── api/
│       ├── auth/           # 鉴权（Auth.js + 验证码）
│       ├── tasks/          # 任务 CRUD
│       ├── ai/extract/     # AI 任务提取
│       ├── ai/report/      # AI 报告生成
│       └── asr/            # 语音转写
├── components/             # UI 组件
├── hooks/                  # React Hooks
└── lib/                    # 核心库（DB、AI、Auth）
```

## 常用命令

```bash
npm run dev              # 本地开发
npx next build           # 生产构建
npx drizzle-kit generate # 生成数据库 migration
npx drizzle-kit migrate  # 运行 migration
```
