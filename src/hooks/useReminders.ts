"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Task } from "@/components/TaskCard";
import { getDueDatePart } from "@/lib/due";

export function useReminders(tasks: Task[]) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const reminders = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return tasks.filter(
      (t) => {
        const dueDate = getDueDatePart(t.due_date);
        return t.status !== "done" && !!dueDate && dueDate <= today && !dismissed.has(t.id);
      }
    );
  }, [tasks, dismissed]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return { reminders, dismiss };
}
