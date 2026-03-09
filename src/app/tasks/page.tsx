"use client";

import { useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { useTasks } from "@/hooks/useTasks";

const statusFilters = [
  { value: "", label: "全部" },
  { value: "todo", label: "待办" },
  { value: "in_progress", label: "进行中" },
  { value: "done", label: "已完成" },
];

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { tasks, loading, updateStatus, deleteTask } = useTasks(
    statusFilter ? { status: statusFilter } : undefined
  );

  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight text-warm-800 mb-5">所有任务</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-warm-600 border border-warm-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-warm-300 border-t-accent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-center text-warm-400 py-12 text-sm">暂无任务</p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onStatusChange={updateStatus} onDelete={deleteTask} />
          ))}
        </div>
      )}
    </div>
  );
}
