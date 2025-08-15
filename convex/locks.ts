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

export const acquire = mutation({
  args: {
    id: v.union(v.id("fields"), v.id("assets"))
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
    if (obj.editing && obj.editingBy !== userId) {
      return {
        success: false,
        error: "Object is already being edited by another user",
        _logs: ["Failed to acquire lock: already being edited by another user"]
      };
    }

    const now = Date.now();
    const expiresAt = now + 60 * 1000;
    await ctx.db.patch(args.id, {
      editing: true,
      editingBy: userId,
      editingLockExpires: expiresAt
    });
    return { success: true, _logs: ["Lock acquired"] };
  }
});

export const release = mutation({
  args: {
    id: v.union(v.id("fields"), v.id("assets"))
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
    if (!obj.editing || obj.editingBy !== userId) {
      return {
        success: false,
        error: "Object is not being edited by you",
        _logs: ["Failed to release lock: not being edited by you"]
      };
    }
    await ctx.db.patch(args.id, {
      editing: false,
      editingBy: undefined,
      editingLockExpires: undefined
    });
    return { success: true, _logs: ["Lock released"] };
  }
});

export const renew = mutation({
  args: {
    id: v.union(v.id("fields"), v.id("assets"))
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
    if (!obj.editing || obj.editingBy !== userId) {
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
