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
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">全部任务</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              statusFilter === f.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">加载中...</p>
      ) : tasks.length === 0 ? (
        <p className="text-center text-gray-400 py-8">暂无任务</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onStatusChange={updateStatus} onDelete={deleteTask} />
          ))}
        </div>
      )}
    </div>
  );
}
