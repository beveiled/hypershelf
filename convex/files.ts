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
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async ctx => {
    return await ctx.storage.generateUploadUrl();
  }
});

export const attachMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string()
  },
  handler: async (ctx, { storageId, fileName }) => {
    return {
      fileId: await ctx.db.insert("files", {
        storageId: storageId,
        fileName: fileName
      })
    };
  }
});

export const getMetadata = query({
  args: {
    fileId: v.id("files")
  },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    return {
      storageId: file.storageId,
      fileName: file.fileName
    } as {
      storageId: Id<"_storage">;
      fileName: string;
    };
  }
});
