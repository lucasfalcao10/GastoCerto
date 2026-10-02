CREATE TABLE `finance_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'pluggy',
	`institution` varchar(80) NOT NULL DEFAULT 'C6 Bank',
	`itemId` varchar(128),
	`status` enum('pending','connected','error') NOT NULL DEFAULT 'pending',
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalId` varchar(128),
	`type` enum('expense','income') NOT NULL,
	`amountCents` int NOT NULL,
	`entryDate` varchar(10) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(80) NOT NULL,
	`paymentMethod` varchar(24) NOT NULL,
	`source` enum('manual','c6','import') NOT NULL DEFAULT 'manual',
	`installmentCurrent` int,
	`installmentTotal` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthKey` varchar(7) NOT NULL,
	`incomeCents` int NOT NULL,
	`budgetsJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finance_plans_id` PRIMARY KEY(`id`)
);
