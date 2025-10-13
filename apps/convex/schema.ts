import type { FunctionReturnType } from "convex/server";
import type { Infer } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import type { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const fieldSchema = {
  name: v.string(),
  type: v.string(),
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
      multiselect: v.optional(v.boolean()),
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
          maxValue: v.optional(v.number()),
        }),
      ),
    }),
  ),
};

const fieldSchemaInternal = {
  ...fieldSchema,
  slug: v.string(),
  /** @deprecated Use `editingBy` instead */
  editing: v.optional(v.boolean()),
  editingBy: v.optional(v.id("users")),
  editingLockExpires: v.optional(v.number()),
  /** @deprecated Not used anymore */
  persistent: v.optional(v.boolean()),
  deleted: v.optional(v.boolean()),
};

export const valueSchema = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string()),
  v.null(),
);

export const assetSchema = {
  metadata: v.optional(v.record(v.id("fields"), valueSchema)),
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
  editingLockExpires: v.optional(v.number()),
  vsphereLastSync: v.optional(v.number()),
  vsphereMoid: v.optional(v.string()),
  vsphereMetadata: v.optional(v.record(v.string(), valueSchema)),
  deleted: v.optional(v.boolean()),
};

export const vSphereSchema = {
  moid: v.string(),
  hostname: v.optional(v.string()),
  primaryIp: v.optional(v.string()),
  ips: v.optional(v.array(v.string())),
  cpuCores: v.number(),
  memoryMb: v.number(),
  guestOs: v.optional(v.string()),
  portgroup: v.optional(v.string()),
  cluster: v.string(),
  drives: v.array(
    v.object({
      sizeGb: v.number(),
      thin: v.boolean(),
      datastore: v.string(),
    }),
  ),
  snaps: v.optional(
    v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        createTime: v.number(),
        withMemory: v.boolean(),
      }),
    ),
  ),
};

const vSphereSchemaInternal = {
  ...vSphereSchema,
  lastSync: v.number(),
};

const assetLocks = {
  assetId: v.id("assets"),
  fieldId: v.id("fields"),
  userId: v.id("users"),
  expires: v.number(),
};

export const fileSchema = {
  storageId: v.string(),
  fileName: v.string(),
};

export const viewSchema = {
  name: v.optional(v.string()),
  /** @deprecated Use `hiddenFields` and `fieldOrder instead */
  fields: v.optional(v.array(v.id("fields"))),
  hiddenFields: v.optional(v.array(v.id("fields"))),
  fieldOrder: v.optional(v.array(v.id("fields"))),
  /** @deprecated Use `sorting` instead */
  sortBy: v.optional(
    v.record(v.id("fields"), v.union(v.literal("asc"), v.literal("desc"))),
  ),
  sorting: v.optional(
    v.record(v.id("fields"), v.union(v.literal("asc"), v.literal("desc"))),
  ),
  filters: v.optional(v.any()),
  enableFiltering: v.optional(v.boolean()),
  global: v.optional(v.boolean()),
  builtin: v.optional(v.boolean()),
};

export const viewSchemaInternal = {
  ...viewSchema,
  userId: v.id("users"),
};

export const waybackSchema = {
  actor: v.id("users"),
  when: v.number(),
  action: v.union(
    v.object({
      type: v.literal("create_asset"),
      assetId: v.id("assets"),
    }),
    v.object({
      type: v.literal("update_asset"),
      assetId: v.id("assets"),
      fieldId: v.id("fields"),
      oldValue: valueSchema,
      newValue: valueSchema,
    }),
    v.object({
      type: v.literal("delete_asset"),
      assetId: v.id("assets"),
    }),
    v.object({
      type: v.literal("restore_asset"),
      assetId: v.id("assets"),
    }),
    v.object({
      type: v.literal("create_field"),
      fieldId: v.id("fields"),
    }),
    v.object({
      type: v.literal("update_field"),
      fieldId: v.id("fields"),
      oldProps: v.object(fieldSchema),
      newProps: v.object(fieldSchema),
    }),
    v.object({
      type: v.literal("delete_field"),
      fieldId: v.id("fields"),
    }),
    v.object({
      type: v.literal("restore_field"),
      fieldId: v.id("fields"),
    }),
  ),
};

export default defineSchema({
  ...authTables,
  assets: defineTable(assetSchemaInternal),
  assetLocks: defineTable(assetLocks).index("by_assetId_fieldId", [
    "assetId",
    "fieldId",
  ]),
  fields: defineTable(fieldSchemaInternal),
  files: defineTable(fileSchema),
  views: defineTable(viewSchemaInternal),
  system: defineTable({ version: v.string() }),
  wayback: defineTable(waybackSchema)
    .index("by_assetId", ["action.assetId"])
    .index("by_fieldId", ["action.fieldId"])
    .index("by_action_type", ["action.type"])
    .index("by_userId", ["actor"]),
  vsphere: defineTable(vSphereSchemaInternal)
    .index("by_hostname", ["hostname"])
    .index("by_ip", ["primaryIp"])
    .index("by_ips", ["ips"]),
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
export type ValueType = Infer<typeof valueSchema>;

export type ExtendedFieldType = FunctionReturnType<
  typeof api.fields.get
>["fields"][number];
export type ExtendedAssetType = FunctionReturnType<
  typeof api.assets.get
>["assets"][number];
