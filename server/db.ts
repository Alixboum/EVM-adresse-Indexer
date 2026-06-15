import { eq, desc, and, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  profiles, InsertProfile,
  evmAddresses, InsertEvmAddress,
  socialAccounts, InsertSocialAccount,
  addressConnections, InsertAddressConnection,
  searchHistory, InsertSearchHistoryEntry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function createProfile(data: InsertProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(profiles).values(data);
  return { id: result[0].insertId };
}

export async function getProfilesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.updatedAt));
}

export async function getProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return result[0];
}

export async function updateProfile(id: number, data: Partial<InsertProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(profiles).set(data).where(eq(profiles.id, id));
}

export async function deleteProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(socialAccounts).where(eq(socialAccounts.profileId, id));
  const addresses = await db.select().from(evmAddresses).where(eq(evmAddresses.profileId, id));
  for (const addr of addresses) {
    await db.delete(addressConnections).where(
      or(eq(addressConnections.fromAddressId, addr.id), eq(addressConnections.toAddressId, addr.id))
    );
  }
  await db.delete(evmAddresses).where(eq(evmAddresses.profileId, id));
  await db.delete(profiles).where(eq(profiles.id, id));
}

// ─── EVM Addresses ───────────────────────────────────────────────────────────

export async function addEvmAddress(data: InsertEvmAddress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evmAddresses).values(data);
  return { id: result[0].insertId };
}

export async function getAddressesByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evmAddresses).where(eq(evmAddresses.profileId, profileId)).orderBy(desc(evmAddresses.createdAt));
}

export async function getAddressById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evmAddresses).where(eq(evmAddresses.id, id)).limit(1);
  return result[0];
}

export async function updateEvmAddress(id: number, data: Partial<InsertEvmAddress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(evmAddresses).set(data).where(eq(evmAddresses.id, id));
}

export async function deleteEvmAddress(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(addressConnections).where(
    or(eq(addressConnections.fromAddressId, id), eq(addressConnections.toAddressId, id))
  );
  await db.delete(evmAddresses).where(eq(evmAddresses.id, id));
}

// ─── Social Accounts ─────────────────────────────────────────────────────────

export async function addSocialAccount(data: InsertSocialAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialAccounts).values(data);
  return { id: result[0].insertId };
}

export async function getSocialsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialAccounts).where(eq(socialAccounts.profileId, profileId));
}

export async function updateSocialAccount(id: number, data: Partial<InsertSocialAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialAccounts).set(data).where(eq(socialAccounts.id, id));
}

export async function getSocialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteSocialAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
}

// ─── Address Connections ─────────────────────────────────────────────────────

export async function addConnection(data: InsertAddressConnection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(addressConnections).values(data);
  return { id: result[0].insertId };
}

export async function getConnectionsByAddress(addressId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addressConnections).where(
    or(eq(addressConnections.fromAddressId, addressId), eq(addressConnections.toAddressId, addressId))
  );
}

export async function getConnectionsByProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  const addresses = await db.select().from(evmAddresses).where(eq(evmAddresses.profileId, profileId));
  if (addresses.length === 0) return [];
  const addressIds = addresses.map(a => a.id);
  const allConnections = [];
  for (const addrId of addressIds) {
    const conns = await db.select().from(addressConnections).where(
      or(eq(addressConnections.fromAddressId, addrId), eq(addressConnections.toAddressId, addrId))
    );
    allConnections.push(...conns);
  }
  // Deduplicate
  const seen = new Set<number>();
  return allConnections.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export async function getConnectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(addressConnections).where(eq(addressConnections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteConnection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(addressConnections).where(eq(addressConnections.id, id));
}

// ─── Address Search (local DB) ──────────────────────────────────────────────

export async function searchAddressesInDb(query: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  const normalizedQuery = query.toLowerCase().trim();
  // Find all addresses matching the query (by address or label)
  const results = await db
    .select({
      id: evmAddresses.id,
      address: evmAddresses.address,
      chain: evmAddresses.chain,
      label: evmAddresses.label,
      notes: evmAddresses.notes,
      arkhamEntity: evmAddresses.arkhamEntity,
      arkhamLabels: evmAddresses.arkhamLabels,
      profileId: evmAddresses.profileId,
      profileName: profiles.name,
      profileTags: profiles.tags,
    })
    .from(evmAddresses)
    .innerJoin(profiles, eq(evmAddresses.profileId, profiles.id))
    .where(
      and(
        eq(profiles.userId, userId),
        or(
          like(evmAddresses.address, `%${normalizedQuery}%`),
          like(evmAddresses.label, `%${normalizedQuery}%`)
        )
      )
    )
    .limit(20);
  return results;
}

// ─── Search History ──────────────────────────────────────────────────────────

export async function addSearchEntry(data: InsertSearchHistoryEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(searchHistory).values(data);
  return { id: result[0].insertId };
}

export async function getSearchHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

export async function deleteSearchEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(searchHistory).where(eq(searchHistory.id, id));
}
