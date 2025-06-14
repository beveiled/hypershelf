import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import Password from "./authProviders/customPassword";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password]
});

export const getCurrentUser = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return ctx.db.get(userId);
  }
});
