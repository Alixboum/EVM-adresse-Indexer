import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { arkhamSearch } from "./arkham";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profiles ──────────────────────────────────────────────────────────────
  profiles: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getProfilesByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.id);
        if (!profile || profile.userId !== ctx.user.id) return null;
        const addresses = await db.getAddressesByProfile(input.id);
        const socials = await db.getSocialsByProfile(input.id);
        const connections = await db.getConnectionsByProfile(input.id);
        return { profile, addresses, socials, connections };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        notes: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProfile({
          userId: ctx.user.id,
          name: input.name,
          notes: input.notes || null,
          tags: input.tags || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
        avatar: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.id);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        const { id, ...data } = input;
        await db.updateProfile(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.id);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        await db.deleteProfile(input.id);
        return { success: true };
      }),
  }),

  // ─── EVM Addresses ─────────────────────────────────────────────────────────
  addresses: router({
    add: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        address: z.string().min(42).max(42),
        chain: z.string().default("ethereum"),
        label: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        return db.addEvmAddress({
          profileId: input.profileId,
          address: input.address.toLowerCase(),
          chain: input.chain,
          label: input.label || null,
          notes: input.notes || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        notes: z.string().optional(),
        chain: z.string().optional(),
        arkhamEntity: z.string().optional(),
        arkhamLabels: z.string().optional(),
        arkhamTags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const addr = await db.getAddressById(input.id);
        if (!addr) throw new Error("Not found");
        const profile = await db.getProfileById(addr.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");
        const { id, ...data } = input;
        await db.updateEvmAddress(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const addr = await db.getAddressById(input.id);
        if (!addr) throw new Error("Not found");
        const profile = await db.getProfileById(addr.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");
        await db.deleteEvmAddress(input.id);
        return { success: true };
      }),

    enrich: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const addr = await db.getAddressById(input.id);
        if (!addr) throw new Error("Not found");
        const profile = await db.getProfileById(addr.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");

        const result = await arkhamSearch(addr.address);
        if (result) {
          await db.updateEvmAddress(input.id, {
            arkhamEntity: result.entity || null,
            arkhamLabels: result.labels || null,
            arkhamTags: result.tags || null,
          });
          // Save to search history
          await db.addSearchEntry({
            userId: ctx.user.id,
            query: addr.address,
            queryType: "address_enrich",
            resultSummary: result.entity || "No entity found",
            resultData: JSON.stringify(result),
          });
        }
        return result;
      }),
  }),

  // ─── Social Accounts ───────────────────────────────────────────────────────
  socials: router({
    add: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        platform: z.string().default("twitter"),
        username: z.string().min(1),
        profileUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        return db.addSocialAccount({
          profileId: input.profileId,
          platform: input.platform,
          username: input.username,
          profileUrl: input.profileUrl || null,
          notes: input.notes || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        username: z.string().optional(),
        profileUrl: z.string().optional(),
        verified: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateSocialAccount(id, data);
        return { success: true };
      }),

    toggleVerified: protectedProcedure
      .input(z.object({ id: z.number(), verified: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const social = await db.getSocialById(input.id);
        if (!social) throw new Error("Not found");
        const profile = await db.getProfileById(social.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");
        await db.updateSocialAccount(input.id, { verified: input.verified });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const social = await db.getSocialById(input.id);
        if (!social) throw new Error("Not found");
        const profile = await db.getProfileById(social.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");
        await db.deleteSocialAccount(input.id);
        return { success: true };
      }),
  }),

  // ─── Connections ───────────────────────────────────────────────────────────
  connections: router({
    add: protectedProcedure
      .input(z.object({
        fromAddressId: z.number(),
        toAddressId: z.number(),
        connectionType: z.string().default("transfer"),
        notes: z.string().optional(),
        txHash: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership of both addresses
        const fromAddr = await db.getAddressById(input.fromAddressId);
        const toAddr = await db.getAddressById(input.toAddressId);
        if (!fromAddr || !toAddr) throw new Error("Address not found");
        const fromProfile = await db.getProfileById(fromAddr.profileId);
        const toProfile = await db.getProfileById(toAddr.profileId);
        if (!fromProfile || fromProfile.userId !== ctx.user.id) throw new Error("Not authorized");
        if (!toProfile || toProfile.userId !== ctx.user.id) throw new Error("Not authorized");

        return db.addConnection({
          fromAddressId: input.fromAddressId,
          toAddressId: input.toAddressId,
          connectionType: input.connectionType,
          notes: input.notes || null,
          txHash: input.txHash || null,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conn = await db.getConnectionById(input.id);
        if (!conn) throw new Error("Not found");
        const addr = await db.getAddressById(conn.fromAddressId);
        if (!addr) throw new Error("Not found");
        const profile = await db.getProfileById(addr.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not authorized");
        await db.deleteConnection(input.id);
        return { success: true };
      }),
  }),

  // ─── Search / Arkham ───────────────────────────────────────────────────────
  search: router({
    // Search local database for matching addresses
    local: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return db.searchAddressesInDb(input.query, ctx.user.id);
      }),

    arkham: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        queryType: z.string().default("address"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await arkhamSearch(input.query);
        await db.addSearchEntry({
          userId: ctx.user.id,
          query: input.query,
          queryType: input.queryType,
          resultSummary: result?.entity || "No results",
          resultData: JSON.stringify(result),
        });
        return result;
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(({ ctx, input }) => {
        return db.getSearchHistory(ctx.user.id, input?.limit || 50);
      }),

    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSearchEntry(input.id);
        return { success: true };
      }),
  }),

  // ─── Export ─────────────────────────────────────────────────────────────────
  export: router({
    all: protectedProcedure.query(async ({ ctx }) => {
      return db.getFullExportData(ctx.user.id);
    }),
  }),

  // ─── Sharing ───────────────────────────────────────────────────────────────
  sharing: router({
    createLink: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        permission: z.enum(["view", "edit"]).default("view"),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        const shareToken = nanoid(32);
        await db.createShareLink({
          profileId: input.profileId,
          ownerId: ctx.user.id,
          shareToken,
          shareType: "link",
          permission: input.permission,
        });
        return { shareToken };
      }),

    getByProfile: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getProfileById(input.profileId);
        if (!profile || profile.userId !== ctx.user.id) throw new Error("Not found");
        return db.getSharesByProfile(input.profileId);
      }),

    viewShared: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const share = await db.getShareByToken(input.token);
        if (!share) throw new Error("Share link not found or expired");
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          throw new Error("Share link expired");
        }
        const profile = await db.getProfileById(share.profileId);
        if (!profile) throw new Error("Profile not found");
        const addresses = await db.getAddressesByProfile(share.profileId);
        const socials = await db.getSocialsByProfile(share.profileId);
        const connections = await db.getConnectionsByProfile(share.profileId);
        return { profile, addresses, socials, connections, permission: share.permission };
      }),

    mySharedProfiles: protectedProcedure.query(async ({ ctx }) => {
      return db.getSharedWithUser(ctx.user.id);
    }),

    deleteLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const share = await db.getShareById(input.id);
        if (!share || share.ownerId !== ctx.user.id) throw new Error("Not found or not authorized");
        await db.deleteShareLink(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
