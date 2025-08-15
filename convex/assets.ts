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
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assetSchema, FieldType, ValueType } from "./schema";
import { validateFields } from "./utils";

export const get = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { assets: [] };
    }

    const assets = await ctx.db.query("assets").order("asc").collect();
    const editors = await Promise.all(
      assets.map(f =>
        f.editingBy ? ctx.db.get(f.editingBy) : Promise.resolve(null)
      )
    );

    return {
      assets: assets.map((asset, i) => ({
        asset,
        editingBy: editors[i]
      }))
    };
  }
});

export const create = mutation({
  args: assetSchema,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        errors: { _: "Not authenticated" },
        _logs: ["Failed to create asset: not authenticated"]
      };
    }

    if (!args.metadata) {
      return {
        success: false,
        errors: { _: "Metadata is required" },
        _logs: ["Failed to create asset: metadata is required"]
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
        })
      );
    } catch {
      return {
        success: false,
        errors: { _: "Unknown error" },
        _logs: ["Failed to fetch fields"]
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
      editing: false,
      editingBy: undefined,
      editingLockExpires: undefined
    };

    const assetId = await ctx.db.insert("assets", asset);
    return {
      success: true,
      assetId,
      _logs: ["Asset created successfully"]
    };
  }
});

export const update = mutation({
  args: {
    assetId: v.id("assets"),
    values: v.record(v.id("fields"), v.any())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        errors: { _: "Not authenticated" },
        _logs: ["Failed to update asset: not authenticated"]
      };
    }
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return {
        success: false,
        errors: { _: "Asset not found" },
        _logs: ["Failed to update asset: asset not found"]
      };
    }
    if (asset.editing && asset.editingBy !== userId) {
      return {
        success: false,
        errors: { _: "Asset is not being edited by you" },
        _logs: [`Failed to update asset: not being edited by you`]
      };
    }
    const metadata = asset.metadata!;
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
      return {
        success: false,
        errors: { _: "Unknown error" },
        _logs: ["Failed to fetch fields"]
      };
    }

    const errors = validateFields(fields, args.values);
    if (errors !== null) {
      return { success: false, errors };
    }

    for (const [fieldId, value] of Object.entries(args.values)) {
      const field = fields.find(f => f._id === fieldId);
      if (field) {
        metadata[field._id] = value;
      }
    }

    await ctx.db.patch(args.assetId, {
      metadata,
      updatedAt: Date.now()
    });

    return {
      success: true,
      _logs: [
        "Asset updated successfully",
        ...(!asset.editing ? ["Warning: lock missing"] : [])
      ]
    };
  }
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        success: false,
        error: "Not authenticated",
        _logs: ["Failed to delete asset: not authenticated"]
      };
    }

    const asset = await ctx.db.get(id);
    if (!asset) {
      return {
        success: false,
        error: "Asset not found",
        _logs: ["Failed to delete asset: asset not found"]
      };
    }

    await ctx.db.delete(id);
    return { success: true, _logs: ["Asset deleted successfully"] };
  }
});
