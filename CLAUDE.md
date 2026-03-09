# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CoWorker — AI智能任务管理移动端Web App。用自然语言（文字/语音）记录任务，AI自动提取结构化信息，到期提醒，自动生成工作报告。

## 常用命令

```bash
npm run dev          # 本地开发服务器
npx next build       # 生产构建
npx drizzle-kit generate  # 生成数据库migration
npx drizzle-kit migrate   # 运行migration
```

## 技术架构

- **框架**: Next.js (App Router) + Tailwind CSS
- **数据库**: SQLite (开发) / Turso (生产)，Drizzle ORM
- **AI**: 支持 Qwen3.5-Plus 和 DeepSeek-V3.2 双供应商，通过 `AI_PROVIDER` 环境变量切换
- **ASR**: 阿里云 Qwen3-ASR-Flash-Realtime
- **部署**: Vercel

## 核心文件

- `src/lib/schema.ts` — 数据库表定义（tasks表）
- `src/lib/db.ts` — 数据库连接
- `src/lib/ai.ts` — AI客户端（Qwen/DeepSeek可切换）
- `src/app/api/tasks/route.ts` — 任务CRUD API
- `src/app/api/ai/extract/route.ts` — AI任务提取（自然语言→结构化JSON）
- `src/app/api/ai/report/route.ts` — AI报告生成

## 页面结构（3页）

- `/` — 今日视图 + 快速输入
- `/tasks` — 全部任务列表
- `/reports` — 报告生成

## 环境变量 (.env.local)

```
AI_PROVIDER=qwen|deepseek
DASHSCOPE_API_KEY=xxx    # Qwen AI + ASR
DEEPSEEK_API_KEY=xxx     # DeepSeek AI
```

## 开发原则

- 极致简洁，不做加法
- 核心价值：转写准、提炼准、总结精炼
- 移动端优先，触控友好（最小44px触控区域）

## 项目文档

- `docs/plan.md` — 完整规划文档
- `memory/YYYY-MM-DD.md` — 每日开发记录
