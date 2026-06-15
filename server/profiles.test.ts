import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("profiles router", () => {
  it("lists profiles for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const profiles = await caller.profiles.list();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it("creates a profile successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profiles.create({
      name: "Test Investigation",
      notes: "Testing profile creation",
      tags: "test,investigation",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("rejects profile creation without authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profiles.create({ name: "Should Fail" })
    ).rejects.toThrow();
  });
});

describe("search router", () => {
  it("performs arkham search for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.search.arkham({
      query: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
      queryType: "address",
    });
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("arkhamUrl");
    }
  });

  it("retrieves search history for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const history = await caller.search.history();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("arkham module", () => {
  it("returns valid result structure", async () => {
    const { arkhamSearch } = await import("./arkham");
    const result = await arkhamSearch("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28");
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("arkhamUrl");
      expect(result).toHaveProperty("chains");
      expect(Array.isArray(result.chains)).toBe(true);
    }
  });

  it("handles entity search", async () => {
    const { arkhamSearch } = await import("./arkham");
    const result = await arkhamSearch("binance");
    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("arkhamUrl");
    }
  });
});
