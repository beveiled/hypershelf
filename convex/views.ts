/*
https://github.com/hikariatama/hypershelf
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
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { viewSchema } from "./schema";
import { v } from "convex/values";

export type ViewType = Doc<"views">;
export type ExtendedViewType = ViewType & {
  immutable: boolean;
  global: boolean;
};

export const get = query({
  args: {
    ignoreImmutable: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        views: []
      };
    }

    const views = await ctx.db
      .query("views")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    const globalViews = await ctx.db
      .query("views")
      .filter(q => q.eq(q.field("global"), true))
      .collect();
    const fields = await ctx.db.query("fields").collect();
    const builtin = [
      {
        _id: "builtin:all",
        name: "All",
        userId: null,
        global: true,
        fields: fields.map(f => f._id),
        sortBy: [],
        filters: [],
        enableFiltering: false,
        builtin: true
      }
    ];

    return {
      views: [...builtin, ...views, ...globalViews]
        .filter(v => v !== null)
        .map(v => ({
          ...v,
          immutable: v.userId !== userId && v.global
        }))
        .filter(v => {
          if (!args.ignoreImmutable) return true;
          return !v.immutable;
        }) as ExtendedViewType[]
    };
  }
});

export const create = mutation({
  args: {
    name: viewSchema.name
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const fields = await ctx.db.query("fields").collect();

    const view = await ctx.db.insert("views", {
      userId,
      name: args.name,
      fields: fields.map(f => f._id)
    });

    return view;
  }
});

export const update = mutation({
  args: {
    viewId: v.id("views"),
    ...viewSchema
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { viewId, name, global, builtin, ...other } = args;
    const view = await ctx.db.get(viewId);
    if (view === null) {
      throw new Error("View not found");
    }

    await ctx.db.patch(args.viewId, {
      ...other,
      ...(name && { name: name })
    });

    return view;
  }
});

export const remove = mutation({
  args: {
    viewId: v.id("views")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const view = await ctx.db.get(args.viewId);
    if (view === null) {
      throw new Error("View not found");
    }

    await ctx.db.delete(args.viewId);

    return view;
  }
});

export const makeGlobal = mutation({
  args: {
    viewId: v.id("views")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const view = await ctx.db.get(args.viewId);
    if (view === null) {
      throw new Error("View not found");
    }

    if (view.global) {
      throw new Error("View is already global");
    }

    await ctx.db.patch(args.viewId, { global: true });

    return view;
  }
});
