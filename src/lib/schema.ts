import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  display_name: text("display_name"),
  status: text("status", { enum: ["active", "disabled"] }).default("active").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  last_login_at: text("last_login_at"),
});

export const authCodes = sqliteTable(
  "auth_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    code_hash: text("code_hash").notNull(),
    expires_at: text("expires_at").notNull(),
    consumed_at: text("consumed_at"),
    attempts: integer("attempts").default(0).notNull(),
    created_at: text("created_at").notNull(),
  },
  (table) => ({
    emailCreatedAtIdx: index("auth_codes_email_created_at_idx").on(table.email, table.created_at),
  })
);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
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
