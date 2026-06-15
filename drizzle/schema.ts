import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Investigation profiles - each profile represents a person/entity being investigated
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  notes: text("notes"),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * EVM addresses linked to profiles
 */
export const evmAddresses = mysqlTable("evm_addresses", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  address: varchar("address", { length: 42 }).notNull(),
  chain: varchar("chain", { length: 64 }).notNull().default("ethereum"),
  label: varchar("label", { length: 255 }),
  notes: text("notes"),
  arkhamEntity: text("arkhamEntity"),
  arkhamLabels: text("arkhamLabels"),
  arkhamTags: text("arkhamTags"),
  lastEnriched: timestamp("lastEnriched"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Social accounts linked to profiles
 */
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  platform: varchar("platform", { length: 64 }).notNull().default("twitter"),
  username: varchar("username", { length: 255 }).notNull(),
  profileUrl: text("profileUrl"),
  verified: int("verified").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Connections between addresses (same profile or cross-profile)
 */
export const addressConnections = mysqlTable("address_connections", {
  id: int("id").autoincrement().primaryKey(),
  fromAddressId: int("fromAddressId").notNull(),
  toAddressId: int("toAddressId").notNull(),
  connectionType: varchar("connectionType", { length: 64 }).notNull().default("transfer"),
  notes: text("notes"),
  txHash: text("txHash"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Search history for Arkham lookups
 */
export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 512 }).notNull(),
  queryType: varchar("queryType", { length: 64 }).notNull().default("address"),
  resultSummary: text("resultSummary"),
  resultData: text("resultData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type EvmAddress = typeof evmAddresses.$inferSelect;
export type InsertEvmAddress = typeof evmAddresses.$inferInsert;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;
export type AddressConnection = typeof addressConnections.$inferSelect;
export type InsertAddressConnection = typeof addressConnections.$inferInsert;
export type SearchHistoryEntry = typeof searchHistory.$inferSelect;
export type InsertSearchHistoryEntry = typeof searchHistory.$inferInsert;
