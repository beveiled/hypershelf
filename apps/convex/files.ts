import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, { storageId, fileName }) => {
    return {
      fileId: await ctx.db.insert("files", {
        storageId: storageId,
        fileName: fileName,
      }),
    };
  },
});

export const getMetadata = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    return {
      storageId: file.storageId,
      fileName: file.fileName,
    } as {
      storageId: Id<"_storage">;
      fileName: string;
    };
  },
});
