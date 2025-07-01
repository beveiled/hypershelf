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

export const getAll = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        views: []
      };
    }

    const viewIds = await ctx.db
      .query("views2users")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    const views = await Promise.all(viewIds.map(v => ctx.db.get(v.viewId)));
    return { views: views.filter(v => v !== null) as ViewType[] };
  }
});

export const createView = mutation({
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
      name: args.name,
      fields: fields.map(f => f._id)
    });

    await ctx.db.insert("views2users", {
      viewId: view,
      userId
    });

    return view;
  }
});

export const updateView = mutation({
  args: {
    viewId: v.id("views"),
    fields: viewSchema.fields,
    sortBy: viewSchema.sortBy
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

    await ctx.db.patch(args.viewId, {
      fields: args.fields,
      sortBy: args.sortBy
    });

    return view;
  }
});

export const deleteView = mutation({
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
    const relatons = await ctx.db
      .query("views2users")
      .filter(q => q.eq(q.field("viewId"), args.viewId))
      .collect();

    await Promise.all(relatons.map(r => ctx.db.delete(r._id)));

    return view;
  }
});
