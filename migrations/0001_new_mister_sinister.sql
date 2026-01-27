ALTER TABLE `urls` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `urls` ADD `created_by_anonymous` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `urls_user_id_idx` ON `urls` (`user_id`);