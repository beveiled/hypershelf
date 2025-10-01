import { mutation, query } from "./_generated/server";
import { fieldSchema } from "./schema";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const get = query({
  args: {
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeDeleted }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { fields: [] };
    }

    const fields = await ctx.db
      .query("fields")
      .order("asc")
      .filter(q =>
        q.or(q.neq(q.field("deleted"), true), q.eq(includeDeleted, true)),
      )
      .collect();
    const editors = await Promise.all(
      fields.map(async f => {
        if (!f.editingBy) return null;
        const user = await ctx.db.get(f.editingBy);
        return {
          id: f.editingBy,
          email: user?.email ?? "Unknown User",
        };
      }),
    );

    return {
      fields: fields.map((field, i) => ({
        field,
        editingBy: editors[i],
      })),
    };
  },
});

export const create = mutation({
  args: fieldSchema,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to add field: not authenticated"],
      };
    }

    if (args.type.startsWith("magic__")) {
      const existing = await ctx.db
        .query("fields")
        .filter(q =>
          q.and(
            q.neq(q.field("deleted"), true),
            q.eq(q.field("type"), args.type),
          ),
        )
        .first();
      if (existing) {
        return {
          success: false,
          error: `Magic field of type ${args.type} already exists`,
          _logs: [
            `Failed to add field: magic field of type ${args.type} already exists`,
          ],
        };
      }
    }

    const newField = {
      name: args.name,
      slug: args.name.toLowerCase().replace(/\s+/g, "-"),
      type: args.type,
      required: args.required,
      hidden: args.hidden || false,
      extra: args.extra,
    };
    const fieldId = await ctx.db.insert("fields", newField);
    await ctx.db.insert("wayback", {
      actor: userId,
      when: Date.now(),
      action: {
        type: "create_field",
        fieldId,
      },
    });
    return { success: true, fieldId, _logs: [`Field ${args.name} added`] };
  },
});

export const remove = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to delete field: not authenticated"],
      };
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field || field.deleted) {
      return {
        success: false,
        error: "Field not found",
        _logs: ["Failed to delete field: field not found"],
      };
    }
    if (field.editingBy && field.editingBy !== userId) {
      return {
        success: false,
        error: "Field is being edited by another user",
        _logs: [
          `Failed to delete field ${field.name}: being edited by another user`,
        ],
      };
    }
    await ctx.db.patch(args.fieldId, { deleted: true });
    await ctx.db.insert("wayback", {
      actor: userId,
      when: Date.now(),
      action: { type: "delete_field", fieldId: args.fieldId },
    });
    return { success: true, _logs: [`Field ${field.name} deleted`] };
  },
});

export const update = mutation({
  args: {
    fieldId: v.id("fields"),
    ...fieldSchema,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (args.type.startsWith("magic__")) {
      const existing = await ctx.db
        .query("fields")
        .filter(q =>
          q.and(
            q.neq(q.field("deleted"), true),
            q.eq(q.field("type"), args.type),
            q.neq(q.field("_id"), args.fieldId),
          ),
        )
        .first();
      if (existing) {
        return {
          success: false,
          error: `Magic field of type ${args.type} already exists`,
          _logs: [
            `Failed to update field: magic field of type ${args.type} already exists`,
          ],
        };
      }
    }

    if (args.name.trim().length === 0) {
      return {
        success: false,
        error: "Field name cannot be empty",
      };
    }

    const field = await ctx.db.get(args.fieldId);
    if (!field || field.deleted) {
      return {
        success: false,
        error: "Field not found",
      };
    }

    if (field.editingBy && field.editingBy !== userId) {
      return {
        success: false,
        error: "Field is not being edited by you",
        _logs: [
          `Failed to update field ${field.name}: not being edited by you`,
        ],
      };
    }

    await ctx.db.insert("wayback", {
      actor: userId,
      when: Date.now(),
      action: {
        type: "update_field",
        fieldId: args.fieldId,
        oldProps: {
          name: field.name,
          type: field.type,
          required: field.required,
          hidden: field.hidden,
          extra: field.extra,
        },
        newProps: {
          name: args.name,
          type: args.type,
          required: args.required,
          hidden: args.hidden || false,
          extra: args.extra,
        },
      },
    });

    await ctx.db.patch(args.fieldId, {
      name: args.name.trim(),
      type: args.type,
      required: args.required,
      hidden: args.hidden || false,
      extra: args.extra,
    });
    return {
      success: true,
      _logs: [
        `Field ${field.name.trim()} saved`,
        ...(!field.editingBy ? ["Warning: lock missing"] : []),
      ],
    };
  },
});

export const restore = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, { fieldId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to restore field: not authenticated"],
      };
    }

    const field = await ctx.db.get(fieldId);
    if (!field) {
      return {
        success: false,
        error: "Field not found",
        _logs: ["Failed to restore field: field not found"],
      };
    }
    if (!field.deleted) {
      return {
        success: false,
        error: "Field is not deleted",
        _logs: ["Failed to restore field: field is not deleted"],
      };
    }

    await ctx.db.patch(fieldId, { deleted: false });
    await ctx.db.insert("wayback", {
      actor: userId,
      when: Date.now(),
      action: { type: "restore_field", fieldId },
    });
    return { success: true, _logs: ["Field restored successfully"] };
  },
});
