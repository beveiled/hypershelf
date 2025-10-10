import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { jwtVerify, SignJWT } from "jose";

import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";
import Password from "./authProviders/customPassword";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    ConvexCredentials({
      id: "sigil",
      authorize: async (credentials, ctx) => {
        const sigil = credentials.sigil;
        if (!sigil || typeof sigil !== "string") return null;
        let payload;
        try {
          payload = await jwtVerify(
            sigil,
            new TextEncoder().encode(process.env.SIGIL_SECRET),
          );
        } catch {
          return null;
        }
        if (!payload.payload.sub) return null;
        const user = await ctx.runQuery(internal.auth.getUser, {
          userId: payload.payload.sub as Id<"users">,
        });
        if (!user) return null;
        return { userId: user._id };
      },
    }),
  ],
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return ctx.db.get(userId);
  },
});

export const isAuthed = query({
  handler: async (ctx) => {
    return {
      authed: (await getAuthUserId(ctx)) !== null,
    };
  },
});

export const mintSigil = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const sigil = await new SignJWT({ sub: user._id.toString() })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(process.env.SIGIL_SECRET));
    return sigil;
  },
});

export const getUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});
