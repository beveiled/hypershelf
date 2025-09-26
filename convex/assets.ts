import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { FieldType, ValueType, assetSchema } from "./schema";
import { validateField, validateFields } from "./utils";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const get = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { assets: [] };
    }

    const assets = await ctx.db.query("assets").order("asc").collect();
    const locks = await Promise.all(
      assets.map(asset =>
        ctx.db
          .query("assetLocks")
          .filter(q => q.eq(q.field("assetId"), asset._id))
          .collect(),
      ),
    );
    const editors = await Promise.all(
      assets.map(async (asset, i) => {
        const assetLocks = locks[i];
        return await Promise.all(
          assetLocks.map(async lock => {
            const user = await ctx.db.get(lock.userId);
            return {
              fieldId: lock.fieldId,
              holder: user
                ? { id: user._id, email: user.email }
                : { id: lock.userId, email: "Unknown User" },
              expires: lock.expires,
            };
          }),
        );
      }),
    );

    return {
      assets: assets.map((asset, i) => ({
        asset,
        locks: editors[i],
      })),
    };
  },
});

export const create = mutation({
  args: assetSchema,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        errors: { _: "Not authenticated" },
        _logs: ["Failed to create asset: not authenticated"],
      };
    }

    if (!args.metadata) {
      return {
        success: false,
        errors: { _: "Metadata is required" },
        _logs: ["Failed to create asset: metadata is required"],
      };
    }

    let fields: FieldType[];
    try {
      fields = await Promise.all(
        Object.entries(args.metadata).map(async ([fieldId]) => {
          const field = await ctx.db.get(fieldId as Id<"fields">);
          if (!field) {
            throw new Error(`Field with ID ${fieldId} not found`);
          }
          return field;
        }),
      );
    } catch {
      return {
        success: false,
        errors: { _: "Unknown error" },
        _logs: ["Failed to fetch fields"],
      };
    }
    const metadata: Record<string, ValueType> = {};

    const errors = validateFields(fields, args.metadata);
    if (errors !== null) {
      return { success: false, errors };
    }

    const asset = {
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const assetId = await ctx.db.insert("assets", asset);
    return {
      success: true,
      assetId,
      _logs: ["Asset created successfully"],
    };
  },
});

export const update = mutation({
  args: {
    assetId: v.id("assets"),
    fieldId: v.id("fields"),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        errors: { _: "Not authenticated" },
        _logs: ["Failed to update asset: not authenticated"],
      };
    }
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return {
        success: false,
        errors: { _: "Asset not found" },
        _logs: ["Failed to update asset: asset not found"],
      };
    }
    const existingLock = await ctx.db
      .query("assetLocks")
      .withIndex("by_assetId_fieldId", q =>
        q.eq("assetId", args.assetId).eq("fieldId", args.fieldId),
      )
      .unique();
    if (
      existingLock &&
      existingLock.userId !== userId &&
      existingLock.expires > Date.now()
    ) {
      return {
        success: false,
        errors: { _: "This property is being edited by someone else" },
        _logs: [
          "Failed to update asset: this property is being edited by someone else",
        ],
      };
    }
    const metadata = asset.metadata!;
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error(`Field with ID ${args.fieldId} not found`);
    }

    const error = validateField(field, args.value);
    if (error !== null) {
      return { success: false, error };
    }

    metadata[args.fieldId] = args.value;

    await ctx.db.patch(args.assetId, {
      metadata,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      _logs: ["Asset updated successfully"],
    };
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to delete asset: not authenticated"],
      };
    }

    const asset = await ctx.db.get(id);
    if (!asset) {
      return {
        success: false,
        error: "Asset not found",
        _logs: ["Failed to delete asset: asset not found"],
      };
    }

    await ctx.db.delete(id);
    return { success: true, _logs: ["Asset deleted successfully"] };
  },
});
