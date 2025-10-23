import { query } from "./_generated/server";

export const getVersion = query({
  handler: async (ctx) => {
    const version = await ctx.db.query("system").first();
    return { version: version?.version ?? "unknown" };
  },
});
