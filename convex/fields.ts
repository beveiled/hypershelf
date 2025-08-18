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
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { fieldSchema } from "./schema";

export type FieldType = Doc<"fields">;

export const get = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { fields: [] };
    }

    const fields = await ctx.db.query("fields").order("asc").collect();
    const editors = await Promise.all(
      fields.map(f =>
        f.editingBy ? ctx.db.get(f.editingBy) : Promise.resolve(null)
      )
    );

    return {
      fields: fields.map((field, i) => ({
        field,
        editingBy: editors[i]
      }))
    };
  }
});

export const create = mutation({
  args: fieldSchema,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to add field: not authenticated"]
      };
    }
    const newField = {
      name: args.name,
      slug: args.name.toLowerCase().replace(/\s+/g, "-"),
      type: args.type,
      required: args.required,
      hidden: args.hidden || false,
      extra: args.extra
    };
    const fieldId = await ctx.db.insert("fields", newField);
    return { success: true, fieldId, _logs: [`Field ${args.name} added`] };
  }
});

export const remove = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to delete field: not authenticated"]
      };
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      return {
        success: false,
        error: "Field not found",
        _logs: ["Failed to delete field: field not found"]
      };
    }
    if (field.editingBy && field.editingBy !== userId) {
      return {
        success: false,
        error: "Field is being edited by another user",
        _logs: [
          `Failed to delete field ${field.name}: being edited by another user`
        ]
      };
    }
    await ctx.db.delete(args.fieldId);
    return { success: true, _logs: [`Field ${field.name} deleted`] };
  }
});

export const update = mutation({
  args: {
    fieldId: v.id("fields"),
    ...fieldSchema
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated"
      };
    }

    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      return {
        success: false,
        error: "Field not found"
      };
    }

    if (field.editingBy && field.editingBy !== userId) {
      return {
        success: false,
        error: "Field is not being edited by you",
        _logs: [`Failed to update field ${field.name}: not being edited by you`]
      };
    }

    await ctx.db.patch(args.fieldId, {
      name: args.name,
      type: args.type,
      required: args.required,
      hidden: args.hidden || false,
      extra: args.extra
    });
    return {
      success: true,
      _logs: [
        `Field ${field.name} saved`,
        ...(!field.editingBy ? ["Warning: lock missing"] : [])
      ]
    };
  }
});

export const makePersistent = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to make field persistent: not authenticated"]
      };
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      return {
        success: false,
        error: "Field not found",
        _logs: ["Failed to make field persistent: field not found"]
      };
    }
    if (field.persistent) {
      return {
        success: false,
        error: "Field is already persistent",
        _logs: [`Field ${field.name} is already persistent`]
      };
    }
    await ctx.db.patch(args.fieldId, { persistent: true });
    return { success: true, _logs: [`Field ${field.name} made persistent`] };
  }
});
