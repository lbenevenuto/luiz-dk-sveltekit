CREATE TABLE `urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_code` text NOT NULL,
	`original_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	`user_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urls_short_code_unique` ON `urls` (`short_code`);--> statement-breakpoint
CREATE INDEX `urls_created_at_idx` ON `urls` (`created_at`);--> statement-breakpoint
CREATE INDEX `urls_original_url_idx` ON `urls` (`original_url`);--> statement-breakpoint
CREATE INDEX `urls_user_id_idx` ON `urls` (`user_id`);