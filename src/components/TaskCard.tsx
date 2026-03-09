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

const statusConfig = {
  todo: { label: "待办", bg: "bg-warm-200/60", text: "text-warm-700" },
  in_progress: { label: "进行中", bg: "bg-info-light", text: "text-info" },
  done: { label: "已完成", bg: "bg-success-light", text: "text-success" },
};

const priorityDot = {
  high: "bg-danger",
  mid: "bg-warning",
  low: "bg-success",
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
  if (due < today) return `已逾期`;
  return `${dayjs(due).format("M月D日")}`;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: "todo" | "in_progress" | "done") => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const dueText = formatDueDate(task.due_date);
  const isOverdue = task.due_date && task.due_date < dayjs().format("YYYY-MM-DD") && task.status !== "done";
  const status = statusConfig[task.status];

  return (
    <div className="bg-white rounded-xl px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-warm-200/60 transition-all active:scale-[0.99]">
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className="pt-1.5 shrink-0">
          <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-[15px] font-medium leading-snug ${
            task.status === "done" ? "line-through text-warm-400" : "text-warm-800"
          }`}>
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-warm-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <button
              onClick={() => onStatusChange(task.id, nextStatus[task.status])}
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}
            >
              {status.label}
            </button>

            {dueText && (
              <span className={`text-[11px] flex items-center gap-1 ${
                isOverdue ? "text-danger font-medium" : "text-warm-500"
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {dueText}
              </span>
            )}

            {task.collaborator && (
              <span className="text-[11px] text-warm-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                {task.collaborator}
              </span>
            )}

            {task.project_tag && (
              <span className="text-[11px] bg-accent-light text-accent px-1.5 py-0.5 rounded-full">
                #{task.project_tag}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-warm-300 hover:text-danger text-lg leading-none shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}
