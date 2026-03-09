"use client";

import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { TaskCard, Task } from "@/components/TaskCard";
import { QuickInput } from "@/components/QuickInput";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";

dayjs.locale("zh-cn");

export default function HomePage() {
  const { tasks, loading, updateStatus, deleteTask, createTask } = useTasks();
  const { reminders, dismiss } = useReminders(tasks);
  const [aiLoading, setAiLoading] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");

  // Stats
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  // Today view
  const todayTasks = tasks.filter(
    (t) => t.status !== "done" && (t.due_date === today || (t.due_date && t.due_date < today) || !t.due_date)
  );
  const overdueItems = todayTasks.filter((t) => t.due_date && t.due_date < today);
  const dueTodayItems = todayTasks.filter((t) => t.due_date === today);
  const noDueItems = todayTasks.filter((t) => !t.due_date);

  const handleQuickInput = async (text: string) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          await createTask({ ...task, raw_input: text });
        }
      }
    } catch {
      await createTask({ title: text, raw_input: text });
    } finally {
      setAiLoading(false);
    }
  };

  const stats = [
    { label: "全部任务", value: totalTasks, color: "text-warm-800" },
    { label: "进行中", value: inProgressTasks.length, color: "text-info" },
    { label: "已逾期", value: overdueTasks.length, color: "text-danger" },
    { label: "已完成", value: doneTasks.length, color: "text-success" },
  ];

  const renderSection = (title: string, items: Task[], highlight?: boolean) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          {highlight && <div className="w-1.5 h-1.5 rounded-full bg-danger" />}
          <h2 className={`text-sm font-medium ${highlight ? "text-danger" : "text-warm-500"}`}>
            {title}
          </h2>
          <span className="text-xs text-warm-400">{items.length}</span>
        </div>
        <div className="space-y-2.5">
          {items.map((t) => (
            <TaskCard key={t.id} task={t} onStatusChange={updateStatus} onDelete={deleteTask} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-8 pb-28">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-800">CoWorker</h1>
        <p className="text-sm text-warm-400 mt-0.5">{dayjs().format("M月D日 dddd")}</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-warm-200/60">
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-warm-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attention Banner */}
      {reminders.length > 0 && (
        <div className="mb-5 bg-danger-light rounded-xl px-4 py-3 border border-danger/10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-medium text-danger">
              需要关注
            </span>
          </div>
          {reminders.slice(0, 3).map((r) => (
            <div key={r.id} className="flex justify-between items-center text-xs text-warm-600 mt-1.5">
              <span className="truncate flex-1">{r.title}</span>
              <button onClick={() => dismiss(r.id)} className="text-warm-400 hover:text-danger ml-2 shrink-0">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-warm-200/60 mb-5" />

      {/* Task Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-warm-300 border-t-accent rounded-full animate-spin" />
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">&#9745;</div>
          <p className="text-sm text-warm-400">暂无待办任务</p>
          <p className="text-xs text-warm-300 mt-1">试试语音或文字输入添加任务</p>
        </div>
      ) : (
        <>
          {renderSection("需要关注", overdueItems, true)}
          {renderSection("今日任务", dueTodayItems)}
          {renderSection("待安排", noDueItems)}
        </>
      )}

      <QuickInput onSubmit={handleQuickInput} loading={aiLoading} />
    </div>
  );
}
