"use client";

import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { TaskCard, Task } from "@/components/TaskCard";
import { QuickInput } from "@/components/QuickInput";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import { compareDueValues, getDueDatePart } from "@/lib/due";

dayjs.locale("zh-cn");

function sortByDueDate(items: Task[]) {
  return [...items].sort((a, b) => compareDueValues(a.due_date, b.due_date));
}

export default function HomePage() {
  const { tasks, loading, updateStatus, updateTask, deleteTask, createTask, createTasks } = useTasks();
  const { reminders, dismiss } = useReminders(tasks);
  const [aiLoading, setAiLoading] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");
  const nextWeek = dayjs().add(7, "day").format("YYYY-MM-DD");

  const totalTasks = tasks.length;
  const openTasks = tasks.filter((t) => t.status !== "done");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const overdueTasks = openTasks.filter((t) => {
    const dueDate = getDueDatePart(t.due_date);
    return dueDate && dueDate < today;
  });
  const doneTasks = tasks.filter((t) => t.status === "done");

  const overdueItems = sortByDueDate(overdueTasks);
  const dueTodayItems = sortByDueDate(openTasks.filter((t) => getDueDatePart(t.due_date) === today));
  const thisWeekItems = sortByDueDate(
    openTasks.filter((t) => {
      const dueDate = getDueDatePart(t.due_date);
      return dueDate && dueDate > today && dueDate <= nextWeek;
    })
  );
  const noDueItems = openTasks.filter((t) => !t.due_date);
  const laterItems = sortByDueDate(
    openTasks.filter((t) => {
      const dueDate = getDueDatePart(t.due_date);
      return dueDate && dueDate > nextWeek;
    })
  );

  const hasVisibleTasks =
    overdueItems.length > 0 ||
    dueTodayItems.length > 0 ||
    thisWeekItems.length > 0 ||
    noDueItems.length > 0 ||
    laterItems.length > 0;

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
        await createTasks(data.tasks.map((task: Partial<Task>) => ({ ...task, raw_input: text })));
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
        <div className="mb-3 flex items-center gap-2">
          {highlight && <div className="h-1.5 w-1.5 rounded-full bg-danger" />}
          <h2 className={`text-sm font-medium ${highlight ? "text-danger" : "text-warm-500"}`}>{title}</h2>
          <span className="text-xs text-warm-400">{items.length}</span>
        </div>
        <div className="space-y-2.5">
          {items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={updateStatus}
              onScheduleChange={(id, due_date) => updateTask({ id, due_date })}
              onDelete={deleteTask}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-8 pb-28">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-800">CoWorker</h1>
        <p className="mt-0.5 text-sm text-warm-400">{dayjs().format("M月D日 dddd")}</p>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-warm-200/60 bg-white p-3 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="mt-0.5 text-[11px] text-warm-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {reminders.length > 0 && (
        <div className="mb-5 rounded-xl border border-danger/10 bg-danger-light px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span className="text-sm font-medium text-danger">需要关注</span>
          </div>
          {reminders.slice(0, 3).map((reminder) => (
            <div key={reminder.id} className="mt-1.5 flex items-center justify-between text-xs text-warm-600">
              <span className="flex-1 truncate">{reminder.title}</span>
              <button onClick={() => dismiss(reminder.id)} className="ml-2 shrink-0 text-warm-400 hover:text-danger">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 border-t border-warm-200/60" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-warm-300 border-t-accent" />
        </div>
      ) : !hasVisibleTasks ? (
        <div className="py-12 text-center">
          <div className="mb-3 text-3xl">&#9745;</div>
          <p className="text-sm text-warm-400">暂无待办任务</p>
          <p className="mt-1 text-xs text-warm-300">试试语音或文字输入添加任务</p>
        </div>
      ) : (
        <>
          {renderSection("需要关注", overdueItems, true)}
          {renderSection("今天要做", dueTodayItems)}
          {renderSection("未来 7 天", thisWeekItems)}
          {renderSection("待安排", noDueItems)}
          {renderSection("更后续安排", laterItems)}
        </>
      )}

      <QuickInput onSubmit={handleQuickInput} loading={aiLoading} />
    </div>
  );
}
