"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/components/TaskCard";

export function useTasks(params?: Record<string, string>) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const query = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tasks${query}`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (id: string, status: "todo" | "in_progress" | "done") => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    refresh();
  };

  const createTask = async (task: Partial<Task>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      console.error("Create task failed:", error ?? { status: res.status });
      throw new Error(`Create task failed with status ${res.status}`);
    }
    refresh();
  };

  return { tasks, loading, refresh, updateStatus, deleteTask, createTask };
}
