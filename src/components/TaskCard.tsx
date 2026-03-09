"use client";

import dayjs from "dayjs";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: "high" | "mid" | "low";
  status: "todo" | "in_progress" | "done";
  collaborator?: string | null;
  project_tag?: string | null;
  raw_input?: string | null;
  created_at: string;
  completed_at?: string | null;
}

const priorityColors = {
  high: "border-l-red-500",
  mid: "border-l-yellow-500",
  low: "border-l-green-500",
};

const statusLabels = {
  todo: "待办",
  in_progress: "进行中",
  done: "已完成",
};

const nextStatus: Record<string, "todo" | "in_progress" | "done"> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

function formatDueDate(due: string | null | undefined) {
  if (!due) return null;
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
  if (due === today) return "今天";
  if (due === tomorrow) return "明天";
  if (due < today) return `逾期 ${dayjs(today).diff(dayjs(due), "day")} 天`;
  return dayjs(due).format("M/D");
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: "todo" | "in_progress" | "done") => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const dueText = formatDueDate(task.due_date);
  const isOverdue = task.due_date && task.due_date < dayjs().format("YYYY-MM-DD") && task.status !== "done";

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${priorityColors[task.priority]} px-4 py-3 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium truncate ${
              task.status === "done" ? "line-through text-gray-400" : ""
            }`}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {dueText && (
              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                {dueText}
              </span>
            )}
            {task.collaborator && <span>{task.collaborator}</span>}
            {task.project_tag && (
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">{task.project_tag}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
            className={`text-xs px-2 py-1 rounded ${
              task.status === "done"
                ? "bg-green-100 text-green-700"
                : task.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabels[task.status]}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-300 hover:text-red-500 text-sm px-1"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
