import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: text("due_date"),
  priority: text("priority", { enum: ["high", "mid", "low"] })
    .default("mid")
    .notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .default("todo")
    .notNull(),
  collaborator: text("collaborator"),
  project_tag: text("project_tag"),
  raw_input: text("raw_input"),
  created_at: text("created_at").notNull(),
  completed_at: text("completed_at"),
});
