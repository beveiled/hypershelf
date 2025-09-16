import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { users: [] };
    }

    const users = await ctx.db.query("users").order("asc").collect();
    return {
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
      })),
    };
  },
});

export const me = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    return {
      viewer: userId,
    };
  },
});
