CREATE TABLE `shared_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`ownerId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`shareType` varchar(32) NOT NULL DEFAULT 'link',
	`sharedWithUserId` int,
	`permission` varchar(32) NOT NULL DEFAULT 'view',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_profiles_shareToken_unique` UNIQUE(`shareToken`)
);
