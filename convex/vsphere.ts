import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getVsphereData = internalQuery({
  args: {
    id: v.optional(v.id("assets")),
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .filter(q => !args.id || q.eq(q.field("_id"), args.id))
      .collect();

    const magicHostname = await ctx.db
      .query("fields")
      .filter(q => q.eq(q.field("type"), "magic__hostname"))
      .first();
    if (!magicHostname) {
      throw new Error("No magic__hostname field found");
    }

    const magicIp = await ctx.db
      .query("fields")
      .filter(q => q.eq(q.field("type"), "magic__ip"))
      .first();
    if (!magicIp) {
      throw new Error("No magic__ip field found");
    }

    for (const asset of assets) {
      const hostname = asset.metadata?.[magicHostname._id] as
        | string
        | undefined;
      const ip = asset.metadata?.[magicIp._id] as string | undefined;
      if (
        asset.vsphereLastSync &&
        Date.now() - asset.vsphereLastSync < 12 * 60 * 60 * 1000 &&
        asset.vsphereMetadata?.system__cache_key === `${hostname}-${ip}` &&
        !args.id
      ) {
        continue;
      }
      if (!hostname && !ip) {
        continue;
      }
      return {
        id: asset._id,
        hostname: hostname || null,
        ip: ip || null,
      };
    }
    return null;
  },
});

export const applyVsphereData = internalMutation({
  args: {
    id: v.id("assets"),
    metadata: v.record(v.string(), v.any()),
    moid: v.optional(v.string()),
    last_sync: v.number(),
  },
  handler: async (ctx, { id, metadata, moid, last_sync }) => {
    await ctx.db.patch(id, {
      vsphereMetadata: metadata,
      vsphereLastSync: last_sync,
      vsphereMoid: moid,
    });
  },
});

export const requestRefetch = mutation({
  args: {
    id: v.id("assets"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { vsphereLastSync: 0 });
    await ctx.scheduler.runAfter(
      Math.random() * 25000 + 5000,
      internal.vsphereNode.fetchHostAction,
      { id },
    );
  },
});

export const fetchHostMutation = internalMutation({
  handler: async ctx => {
    await ctx.scheduler.runAfter(0, internal.vsphereNode.fetchHostAction, {});
  },
});
