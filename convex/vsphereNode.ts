"use node";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { env } from "./lib/env";
import { fetchHost } from "./lib/integrations/vsphere";
import { getClient } from "./lib/redis";
import { v } from "convex/values";

export const fetchHostAction = internalAction({
  args: {
    id: v.optional(v.id("assets")),
  },
  handler: async (ctx, args) => {
    // ! IMPORTANT: If convex chokes on resources, it might call
    // ! cron jobs in parallel. Debounce calls, so that in such
    // ! a case we don't spam the vSphere API.
    await new Promise(r => setTimeout(r, Math.random() * 14000 + 1000));

    const data = await ctx.runQuery(internal.vsphere.getVsphereData, args);
    if (!data) return;

    const redis = getClient(env.REDIS_URL, env.REDIS_PASSWORD);
    const { id, moid, hostname, ip } = data;
    console.log(`Fetching vSphere data for asset ${id}...`);

    const incoming = await fetchHost({ hostname, ip, moid }, redis);
    if (!incoming) {
      console.log(`No vSphere data found for asset ${id}`);
      await ctx.runMutation(internal.vsphere.applyVsphereData, {
        id,
        metadata: {
          system__cache_key: `${hostname}-${ip}`,
        },
        last_sync: Date.now(),
      });
      return;
    }
    await ctx.runMutation(internal.vsphere.applyVsphereData, {
      id,
      metadata: {
        magic__ip: incoming.ip,
        magic__hostname: incoming.hostname,
        magic__os: incoming.os,
        system__cache_key: `${hostname}-${ip}`,
      },
      last_sync: Date.now(),
      moid: moid ?? undefined,
    });
    console.log(`Applied vSphere data for asset ${id}`);
  },
});
