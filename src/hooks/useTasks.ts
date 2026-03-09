"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/components/TaskCard";

export function useTasks(params?: Record<string, string>) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const refresh = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks${query}`);
      if (!res.ok) {
        throw new Error(`Load tasks failed with status ${res.status}`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("加载任务失败，请稍后重试");
      console.error("Load tasks failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const updateTask = async (task: Partial<Task> & { id: string }) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      console.error("Update task failed:", error ?? { status: res.status });
      throw new Error(`Update task failed with status ${res.status}`);
    }
    await refresh();
  };

  const updateStatus = async (id: string, status: "todo" | "in_progress" | "done") => {
    await updateTask({ id, status });
  };

  const deleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      console.error("Delete task failed:", error ?? { status: res.status });
      throw new Error(`Delete task failed with status ${res.status}`);
    }
    await refresh();
  };

  const createTasks = async (taskList: Partial<Task>[]) => {
    if (taskList.length === 0) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskList),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      console.error("Create task failed:", error ?? { status: res.status });
      throw new Error(`Create task failed with status ${res.status}`);
    }
    await refresh();
  };

  const createTask = async (task: Partial<Task>) => {
    await createTasks([task]);
  };

  return { tasks, loading, error, refresh, updateStatus, updateTask, deleteTask, createTask, createTasks };
}
