CREATE TABLE `address_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromAddressId` int NOT NULL,
	`toAddressId` int NOT NULL,
	`connectionType` varchar(64) NOT NULL DEFAULT 'transfer',
	`notes` text,
	`txHash` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `address_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evm_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`address` varchar(42) NOT NULL,
	`chain` varchar(64) NOT NULL DEFAULT 'ethereum',
	`label` varchar(255),
	`notes` text,
	`arkhamEntity` text,
	`arkhamLabels` text,
	`arkhamTags` text,
	`lastEnriched` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evm_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`avatar` text,
	`notes` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(512) NOT NULL,
	`queryType` varchar(64) NOT NULL DEFAULT 'address',
	`resultSummary` text,
	`resultData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`platform` varchar(64) NOT NULL DEFAULT 'twitter',
	`username` varchar(255) NOT NULL,
	`profileUrl` text,
	`verified` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
