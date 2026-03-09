CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` text,
	`priority` text DEFAULT 'mid' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`collaborator` text,
	`project_tag` text,
	`raw_input` text,
	`created_at` text NOT NULL,
	`completed_at` text
);
