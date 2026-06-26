CREATE TABLE `mcp_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_key` text NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_tokens_key_unique` ON `mcp_tokens` (`token_key`);