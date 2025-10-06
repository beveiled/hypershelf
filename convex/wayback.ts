import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const get = query({
  args: {
    assetId: v.optional(v.id("assets")),
    fieldId: v.optional(v.id("fields")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { wayback: [] };
    }

    if (args.assetId && args.fieldId) {
      const wayback = await ctx.db
        .query("wayback")
        .filter(q =>
          q.and(
            q.eq(q.field("action.type"), "update_asset"),
            q.eq(q.field("action.assetId"), args.assetId),
            q.eq(q.field("action.fieldId"), args.fieldId),
          ),
        )
        .order("asc")
        .collect();
      return { wayback };
    } else if (args.assetId) {
      const wayback = await ctx.db
        .query("wayback")
        .filter(q =>
          q.and(
            q.or(
              q.eq(q.field("action.type"), "create_asset"),
              q.eq(q.field("action.type"), "delete_asset"),
              q.eq(q.field("action.type"), "restore_asset"),
            ),
            q.eq(q.field("action.assetId"), args.assetId),
          ),
        )
        .order("asc")
        .collect();
      return { wayback };
    } else if (args.fieldId) {
      const wayback = await ctx.db
        .query("wayback")
        .filter(q =>
          q.and(
            q.or(
              q.eq(q.field("action.type"), "create_field"),
              q.eq(q.field("action.type"), "update_field"),
              q.eq(q.field("action.type"), "delete_field"),
              q.eq(q.field("action.type"), "restore_field"),
            ),
            q.eq(q.field("action.fieldId"), args.fieldId),
          ),
        )
        .order("asc")
        .collect();
      return { wayback };
    } else {
      const wayback = await ctx.db.query("wayback").order("asc").collect();
      return { wayback };
    }
  },
});
