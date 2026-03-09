"use client";

import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import type { Task } from "@/components/TaskCard";

export function useReminders(tasks: Task[]) {
  const [reminders, setReminders] = useState<Task[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const check = useCallback(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const urgent = tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.due_date &&
        t.due_date <= today &&
        !dismissed.has(t.id)
    );
    setReminders(urgent);
  }, [tasks, dismissed]);

  useEffect(() => {
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [check]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return { reminders, dismiss };
}
