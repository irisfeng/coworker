"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { TaskCard, Task } from "@/components/TaskCard";
import { QuickInput } from "@/components/QuickInput";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";

export default function HomePage() {
  const { tasks, loading, updateStatus, deleteTask, createTask } = useTasks();
  const { reminders, dismiss } = useReminders(tasks);
  const [aiLoading, setAiLoading] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");

  const todayTasks = tasks.filter(
    (t) => t.status !== "done" && (t.due_date === today || (t.due_date && t.due_date < today) || !t.due_date)
  );

  const overdueTasks = todayTasks.filter((t) => t.due_date && t.due_date < today);
  const dueTodayTasks = todayTasks.filter((t) => t.due_date === today);
  const noDueTasks = todayTasks.filter((t) => !t.due_date);

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
      } else {
        await createTask({ title: text, raw_input: text });
      }
    } catch {
      await createTask({ title: text, raw_input: text });
    } finally {
      setAiLoading(false);
    }
  };

  const renderSection = (title: string, items: Task[], highlight?: boolean) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h2 className={`text-sm font-medium mb-2 ${highlight ? "text-red-500" : "text-gray-500"}`}>
          {title}（{items.length}）
        </h2>
        <div className="space-y-2">
          {items.map((t) => (
            <TaskCard key={t.id} task={t} onStatusChange={updateStatus} onDelete={deleteTask} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <header className="mb-6">
        <h1 className="text-xl font-bold">CoWorker</h1>
        <p className="text-sm text-gray-500">{dayjs().format("M月D日 dddd")}</p>
      </header>

      {reminders.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-red-600">
              {reminders.length} 项任务需要关注
            </span>
          </div>
          {reminders.slice(0, 3).map((r) => (
            <div key={r.id} className="flex justify-between items-center text-xs text-red-500 mt-1">
              <span className="truncate flex-1">{r.title}</span>
              <button onClick={() => dismiss(r.id)} className="text-red-300 ml-2 shrink-0">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8">加载中...</p>
      ) : todayTasks.length === 0 ? (
        <p className="text-center text-gray-400 py-8">暂无待办任务</p>
      ) : (
        <>
          {renderSection("逾期", overdueTasks, true)}
          {renderSection("今日", dueTodayTasks)}
          {renderSection("待安排", noDueTasks)}
        </>
      )}

      <QuickInput onSubmit={handleQuickInput} loading={aiLoading} />
    </div>
  );
}
