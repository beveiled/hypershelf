import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { FieldType, ValueType } from "./schema";

export const getAll = query({
  handler: async ctx => {
    const assets = await ctx.db.query("assets").order("asc").collect();
    const editors = await Promise.all(
      assets.map(f =>
        f.editingBy ? ctx.db.get(f.editingBy) : Promise.resolve(null)
      )
    );
    const userId = await getAuthUserId(ctx);

    return {
      viewer: userId,
      assets: assets.map((asset, i) => ({
        asset,
        editingBy: editors[i]
      }))
    };
  }
});

export const acquireLock = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }
    if (asset.editing && asset.editingBy !== userId) {
      throw new Error("Asset is already being edited by another user");
    }
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    await ctx.db.patch(args.assetId, {
      editing: true,
      editingBy: userId,
      editingLockExpires: expiresAt
    });
    return { success: true };
  }
});

export const releaseLock = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }
    if (!asset.editing || asset.editingBy !== userId) {
      throw new Error("Asset is not being edited by you");
    }
    await ctx.db.patch(args.assetId, {
      editing: false,
      editingBy: undefined,
      editingLockExpires: undefined
    });
    return { success: true };
  }
});
export const updateAsset = mutation({
  args: {
    assetId: v.id("assets"),
    values: v.record(v.id("fields"), v.any())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { success: false, errors: { _: "Not authenticated" } };
    }
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return { success: false, errors: { _: "Asset not found" } };
    }
    if (!asset.editing || asset.editingBy !== userId) {
      return {
        success: false,
        errors: { _: "Asset is not being edited by you" }
      };
    }
    const metadata = asset.metadata || {};
    let fields: FieldType[];
    try {
      fields = await Promise.all(
        Object.entries(args.values).map(async ([fieldId]) => {
          const field = await ctx.db.get(fieldId as Id<"fields">);
          if (!field) {
            throw new Error(`Field with ID ${fieldId} not found`);
          }
          return field;
        })
      );
    } catch {
      return { success: false, errors: { _: "Unknown error" } };
    }

    const errors: Record<string, string> = {};

    for (const [fieldId, value] of Object.entries(args.values)) {
      const field = fields.find(f => f._id === fieldId);
      if (!field) {
        errors[fieldId] = `Field with ID ${fieldId} not found`;
        continue;
      }
      if (field.required && (value === undefined || value === "")) {
        errors[fieldId] = `Field is required`;
        continue;
      }
      if (
        field.extra?.regex &&
        value &&
        !new RegExp(field.extra.regex).test(value)
      ) {
        errors[fieldId] =
          field.extra.regexError || `Value does not match the regex`;
        continue;
      }
      if (
        field.extra?.minLength &&
        typeof value === "string" &&
        value.length < field.extra.minLength
      ) {
        errors[fieldId] =
          `Value must be at least ${field.extra.minLength} characters long`;
        continue;
      }
      if (
        field.extra?.maxLength &&
        typeof value === "string" &&
        value.length > field.extra.maxLength
      ) {
        errors[fieldId] =
          `Value must be at most ${field.extra.maxLength} characters long`;
        continue;
      }
      if (
        field.extra?.minValue !== undefined &&
        typeof value === "number" &&
        value < field.extra.minValue
      ) {
        errors[fieldId] = `Value must be at least ${field.extra.minValue}`;
        continue;
      }
      if (
        field.extra?.maxValue !== undefined &&
        typeof value === "number" &&
        value > field.extra.maxValue
      ) {
        errors[fieldId] = `Value must be at most ${field.extra.maxValue}`;
        continue;
      }
      if (field.extra?.options && !field.extra.options.includes(value)) {
        errors[fieldId] = `Value is not an allowed option`;
        continue;
      }
      if (field.extra?.listObjectType && !Array.isArray(value)) {
        errors[fieldId] = `Value must be an array`;
        continue;
      }
      if (field.extra?.listObjectType && Array.isArray(value)) {
        const extra = field?.extra?.listObjectExtra || {};
        for (const [index, item] of value.entries()) {
          if (extra.regex && !new RegExp(extra.regex).test(item)) {
            errors[fieldId] =
              `Item at index ${index} has invalid value for ${item}`;
            break;
          }
          if (
            extra.minLength &&
            typeof item === "string" &&
            item.length < extra.minLength
          ) {
            errors[fieldId] =
              `Item at index ${index} has value for ${item} that is too short`;
            break;
          }
          if (
            extra.maxLength &&
            typeof item === "string" &&
            item.length > extra.maxLength
          ) {
            errors[fieldId] =
              `Item at index ${index} has value for ${item} that is too long`;
            break;
          }
          if (
            extra.minValue !== undefined &&
            typeof item === "number" &&
            item < extra.minValue
          ) {
            errors[fieldId] =
              `Item at index ${index} has value for ${item} that is too low`;
            break;
          }
          if (
            extra.maxValue !== undefined &&
            typeof item === "number" &&
            item > extra.maxValue
          ) {
            errors[fieldId] =
              `Item at index ${index} has value for ${item} that is too high`;
            break;
          }
        }
        if (errors[fieldId]) continue;
      }
      metadata[field._id] = value as ValueType;
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    await ctx.db.patch(args.assetId, {
      metadata,
      updatedAt: Date.now(),
      editing: false,
      editingBy: undefined,
      editingLockExpires: undefined
    });

    return { success: true };
  }
});
