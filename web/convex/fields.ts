import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export type FieldType = Doc<"fields">;

export const getAll = query({
  handler: async ctx => {
    const fields = await ctx.db.query("fields").order("asc").collect();
    const editors = await Promise.all(
      fields.map(f =>
        f.editingBy ? ctx.db.get(f.editingBy) : Promise.resolve(null)
      )
    );
    const userId = await getAuthUserId(ctx);

    return {
      viewer: userId,
      fields: fields.map((field, i) => ({
        field,
        editingBy: editors[i]
      }))
    };
  }
});

export const acquireLock = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }
    if (field.editing && field.editingBy !== userId) {
      throw new Error("Field is already being edited by another user");
    }
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    await ctx.db.patch(args.fieldId, {
      editing: true,
      editingBy: userId,
      editingLockExpires: expiresAt
    });
    return { success: true };
  }
});

export const releaseLock = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }
    if (!field.editing || field.editingBy !== userId) {
      throw new Error("Field is not being edited by you");
    }
    await ctx.db.patch(args.fieldId, {
      editing: false,
      editingBy: undefined,
      editingLockExpires: undefined
    });
    return { success: true };
  }
});

export const updateField = mutation({
  args: {
    fieldId: v.id("fields"),
    name: v.string(),
    slug: v.string(),
    type: v.string(),
    required: v.boolean(),
    extra: v.optional(
      v.object({
        description: v.optional(v.string()),
        placeholder: v.optional(v.string()),
        regex: v.optional(v.string()),
        regexError: v.optional(v.string()),
        minLength: v.optional(v.number()),
        maxLength: v.optional(v.number()),
        minItems: v.optional(v.number()),
        maxItems: v.optional(v.number()),
        minValue: v.optional(v.number()),
        maxValue: v.optional(v.number()),
        icon: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        hideFromSearch: v.optional(v.boolean()),
        listObjectType: v.optional(v.string()),
        listObjectExtra: v.optional(
          v.object({
            regex: v.optional(v.string()),
            regexError: v.optional(v.string()),
            minLength: v.optional(v.number()),
            maxLength: v.optional(v.number()),
            minItems: v.optional(v.number()),
            maxItems: v.optional(v.number()),
            minValue: v.optional(v.number()),
            maxValue: v.optional(v.number())
          })
        )
      })
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }
    if (!field.editing || field.editingBy !== userId) {
      throw new Error("Field is not being edited by you");
    }
    await ctx.db.patch(args.fieldId, {
      name: args.name,
      slug: args.slug,
      type: args.type,
      required: args.required,
      extra: args.extra
    });
  }
});
