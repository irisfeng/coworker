"use client";

import { useState } from "react";
import { formatDueLabel, getDueDatePart, getDueTimePart, isOverdueDue, buildDueValue } from "@/lib/due";

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

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: "todo" | "in_progress" | "done") => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onScheduleChange: (id: string, dueDate?: string | null) => void | Promise<void>;
}

export function TaskCard({ task, onStatusChange, onDelete, onScheduleChange }: TaskCardProps) {
  const dueText = formatDueLabel(task.due_date);
  const isOverdue = task.status !== "done" && isOverdueDue(task.due_date);
  const status = statusConfig[task.status];
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [draftDate, setDraftDate] = useState(getDueDatePart(task.due_date) ?? "");
  const [draftTime, setDraftTime] = useState(getDueTimePart(task.due_date) ?? "");

  const toggleScheduleEditor = () => {
    if (!isEditingSchedule) {
      setDraftDate(getDueDatePart(task.due_date) ?? "");
      setDraftTime(getDueTimePart(task.due_date) ?? "");
    }
    setIsEditingSchedule((current) => !current);
  };

  const saveSchedule = () => {
    onScheduleChange(task.id, buildDueValue(draftDate || undefined, draftTime || undefined));
    setIsEditingSchedule(false);
  };

  const clearSchedule = () => {
    setDraftDate("");
    setDraftTime("");
    onScheduleChange(task.id, null);
    setIsEditingSchedule(false);
  };

  return (
    <div className="rounded-xl border border-warm-200/60 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="shrink-0 pt-1.5">
          <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`text-[15px] font-medium leading-snug ${
              task.status === "done" ? "line-through text-warm-400" : "text-warm-800"
            }`}
          >
            {task.title}
          </h3>

          {task.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-warm-500">{task.description}</p>}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onStatusChange(task.id, nextStatus[task.status])}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.bg} ${status.text}`}
            >
              {status.label}
            </button>

            {dueText && (
              <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "font-medium text-danger" : "text-warm-500"}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                {dueText}
              </span>
            )}

            <button
              onClick={toggleScheduleEditor}
              className="rounded-full border border-warm-200 px-2 py-0.5 text-[11px] font-medium text-warm-600 hover:border-accent hover:text-accent"
            >
              调整时间
            </button>

            {task.collaborator && (
              <span className="flex items-center gap-1 text-[11px] text-warm-500">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                {task.collaborator}
              </span>
            )}

            {task.project_tag && (
              <span className="rounded-full bg-accent-light px-1.5 py-0.5 text-[11px] text-accent">#{task.project_tag}</span>
            )}
          </div>

          {isEditingSchedule && (
            <div className="mt-3 rounded-xl border border-warm-200/70 bg-warm-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                <label className="block text-xs text-warm-500">
                  日期
                  <input
                    type="date"
                    value={draftDate}
                    onChange={(event) => setDraftDate(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-700 outline-none focus:border-accent"
                  />
                </label>
                <label className="block text-xs text-warm-500">
                  时间
                  <input
                    type="time"
                    value={draftTime}
                    onChange={(event) => setDraftTime(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-700 outline-none focus:border-accent"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={clearSchedule}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-warm-500 hover:text-danger"
                >
                  清除
                </button>
                <button
                  onClick={saveSchedule}
                  disabled={!draftDate}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  保存时间
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onDelete(task.id)} className="mt-0.5 shrink-0 text-lg leading-none text-warm-300 hover:text-danger">
          ×
        </button>
      </div>
    </div>
  );
}
