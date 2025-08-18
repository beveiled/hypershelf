/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const acquireField = mutation({
  args: {
    id: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to acquire lock: not authenticated"]
      };
    }
    const obj = await ctx.db.get(args.id);
    if (!obj) {
      return {
        success: false,
        error: "Object not found",
        _logs: ["Failed to acquire lock: not found"]
      };
    }
    if (obj.editingBy && obj.editingBy !== userId) {
      return {
        success: false,
        error: "Object is already being edited by another user",
        _logs: ["Failed to acquire lock: already being edited by another user"]
      };
    }

    const now = Date.now();
    const expiresAt = now + 60 * 1000;
    await ctx.db.patch(args.id, {
      editingBy: userId,
      editingLockExpires: expiresAt
    });
    return { success: true, _logs: ["Lock acquired"] };
  }
});

export const releaseField = mutation({
  args: {
    id: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to release lock: not authenticated"]
      };
    }
    const obj = await ctx.db.get(args.id);
    if (!obj) {
      return {
        success: false,
        error: "Object not found",
        _logs: ["Failed to release lock: not found"]
      };
    }
    if (!obj.editingBy || obj.editingBy !== userId) {
      return {
        success: false,
        error: "Object is not being edited by you",
        _logs: ["Failed to release lock: not being edited by you"]
      };
    }
    await ctx.db.patch(args.id, {
      editingBy: undefined,
      editingLockExpires: undefined
    });
    return { success: true, _logs: ["Lock released"] };
  }
});

export const renewField = mutation({
  args: {
    id: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to renew lock: not authenticated"]
      };
    }
    const obj = await ctx.db.get(args.id);
    if (!obj) {
      return {
        success: false,
        error: "Object not found",
        _logs: ["Failed to renew lock: not found"]
      };
    }
    if (!obj.editingBy || obj.editingBy !== userId) {
      return {
        success: false,
        error: "Event is not being edited by you",
        _logs: ["Failed to renew lock: not being edited by you"]
      };
    }
    const now = Date.now();
    const expiresAt = now + 60 * 1000;
    await ctx.db.patch(args.id, {
      editingLockExpires: expiresAt
    });
    return { success: true, _logs: ["Lock renewed"] };
  }
});

export const acquireAsset = mutation({
  args: {
    assetId: v.id("assets"),
    fieldId: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to acquire asset lock: not authenticated"]
      };
    }

    const existingLock = await ctx.db
      .query("assetLocks")
      .withIndex("by_assetId_fieldId", q =>
        q.eq("assetId", args.assetId).eq("fieldId", args.fieldId)
      )
      .unique();

    if (
      existingLock &&
      existingLock.userId !== userId &&
      existingLock.expires > Date.now()
    ) {
      return {
        success: false,
        error: "This property is being edited by someone else",
        _logs: [
          "Failed to acquire asset lock: this property is being edited by someone else"
        ]
      };
    }

    if (existingLock && existingLock.userId === userId) {
      const expiresAt = Date.now() + 60 * 1000;
      await ctx.db.patch(existingLock._id, { expires: expiresAt });
      return { success: true, _logs: ["Asset lock renewed"] };
    }

    const expiresAt = Date.now() + 60 * 1000;
    await ctx.db.insert("assetLocks", {
      assetId: args.assetId,
      fieldId: args.fieldId,
      userId,
      expires: expiresAt
    });

    return { success: true, _logs: ["Asset lock acquired"] };
  }
});

export const releaseAsset = mutation({
  args: {
    assetId: v.id("assets"),
    fieldId: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to release asset lock: not authenticated"]
      };
    }

    const existingLock = await ctx.db
      .query("assetLocks")
      .withIndex("by_assetId_fieldId", q =>
        q.eq("assetId", args.assetId).eq("fieldId", args.fieldId)
      )
      .unique();

    if (!existingLock || existingLock.userId !== userId) {
      return {
        success: false,
        error: "You do not hold the lock on this asset",
        _logs: ["Failed to release asset lock: you do not hold the lock"]
      };
    }

    await ctx.db.delete(existingLock._id);
    return { success: true, _logs: ["Asset lock released"] };
  }
});

export const renewAsset = mutation({
  args: {
    assetId: v.id("assets"),
    fieldId: v.id("fields")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to renew asset lock: not authenticated"]
      };
    }

    const existingLock = await ctx.db
      .query("assetLocks")
      .withIndex("by_assetId_fieldId", q =>
        q.eq("assetId", args.assetId).eq("fieldId", args.fieldId)
      )
      .unique();

    if (!existingLock || existingLock.userId !== userId) {
      return {
        success: false,
        error: "You do not hold the lock on this asset",
        _logs: ["Failed to renew asset lock: you do not hold the lock"]
      };
    }

    const expiresAt = Date.now() + 60 * 1000;
    await ctx.db.patch(existingLock._id, { expires: expiresAt });

    return { success: true, _logs: ["Asset lock renewed"] };
  }
});
