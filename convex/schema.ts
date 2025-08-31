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
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const fieldSchema = {
  name: v.string(),
  type: v.union(
    v.literal("string"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("array"),
    v.literal("select"),
    v.literal("date"),
    v.literal("email"),
    v.literal("user"),
    v.literal("url"),
    v.literal("ip"),
    v.literal("markdown")
  ),
  required: v.boolean(),
  hidden: v.optional(v.boolean()),
  extra: v.optional(
    v.object({
      description: v.optional(v.string()),
      placeholder: v.optional(v.string()),
      mdPreset: v.optional(v.string()),
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
      subnet: v.optional(v.string()),
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
};

const fieldSchemaInternal = {
  ...fieldSchema,
  slug: v.string(),
  /** @deprecated Use `editingBy` instead */
  editing: v.optional(v.boolean()),
  editingBy: v.optional(v.id("users")),
  editingLockExpires: v.optional(v.number()),
  persistent: v.optional(v.boolean())
};

export const assetSchema = {
  metadata: v.optional(v.record(v.id("fields"), v.any()))
};

const assetSchemaInternal = {
  ...assetSchema,
  /** @deprecated Use `assetLocks` instead */
  mutex: v.optional(v.boolean()),
  /** @deprecated Use `assetLocks` instead */
  mutexHolderId: v.optional(v.id("users")),
  /** @deprecated Use `assetLocks` instead */
  mutexExpiresAt: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  /** @deprecated Use `assetLocks` instead */
  editing: v.optional(v.boolean()),
  /** @deprecated Use `assetLocks` instead */
  editingBy: v.optional(v.id("users")),
  /** @deprecated Use `assetLocks` instead */
  editingLockExpires: v.optional(v.number())
};

const assetLocks = {
  assetId: v.id("assets"),
  fieldId: v.id("fields"),
  userId: v.id("users"),
  expires: v.number()
};

export const fileSchema = {
  storageId: v.string(),
  fileName: v.string()
};

export const viewSchema = {
  name: v.optional(v.string()),
  /** @deprecated Use `hiddenFields` and `fieldOrder instead */
  fields: v.optional(v.array(v.id("fields"))),
  hiddenFields: v.optional(v.array(v.id("fields"))),
  fieldOrder: v.optional(v.array(v.id("fields"))),
  /** @deprecated Use `sorting` instead */
  sortBy: v.optional(
    v.record(v.id("fields"), v.union(v.literal("asc"), v.literal("desc")))
  ),
  sorting: v.optional(
    v.record(v.id("fields"), v.union(v.literal("asc"), v.literal("desc")))
  ),
  filters: v.optional(v.any()),
  enableFiltering: v.optional(v.boolean()),
  global: v.optional(v.boolean()),
  builtin: v.optional(v.boolean())
};

export const viewSchemaInternal = {
  ...viewSchema,
  userId: v.id("users")
};

export default defineSchema({
  ...authTables,
  assets: defineTable(assetSchemaInternal),
  assetLocks: defineTable(assetLocks).index("by_assetId_fieldId", [
    "assetId",
    "fieldId"
  ]),
  fields: defineTable(fieldSchemaInternal),
  files: defineTable(fileSchema),
  views: defineTable(viewSchemaInternal),
  system: defineTable({ version: v.string() })
});

export type AssetType = Doc<"assets"> & {
  /** @deprecated Use `assetLocks` instead */
  mutex?: Doc<"assets">["mutex"];
  /** @deprecated Use `assetLocks` instead */
  mutexHolderId?: Doc<"assets">["mutexHolderId"];
  /** @deprecated Use `assetLocks` instead */
  mutexExpiresAt?: Doc<"assets">["mutexExpiresAt"];
  /** @deprecated Use `assetLocks` instead */
  editing?: Doc<"assets">["editing"];
  /** @deprecated Use `assetLocks` instead */
  editingBy?: Doc<"assets">["editingBy"];
  /** @deprecated Use `assetLocks` instead */
  editingLockExpires?: Doc<"assets">["editingLockExpires"];
};
export type AssetLocksType = Doc<"assetLocks">;
export type FieldType = Doc<"fields"> & {
  /** @deprecated Use `editingBy` instead */
  editing?: Doc<"fields">["editing"];
};
export type UserType = Doc<"users">;
export type ViewType = Doc<"views"> & {
  /** @deprecated Use `hiddenFields` and `fieldOrder instead */
  fields?: Doc<"views">["fields"];
  /** @deprecated Use `sorting` instead */
  sortBy?: Doc<"views">["sortBy"];
};
export type ExtendedViewType = ViewType & {
  immutable: boolean;
  global: boolean;
};
export type ValueType = string | number | boolean | undefined | string[];
