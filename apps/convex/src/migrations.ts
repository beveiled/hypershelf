import { Migrations } from "@convex-dev/migrations";

import type { DataModel } from "./_generated/dataModel.js";
import { components, internal } from "./_generated/api.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();
export const runAll = migrations.runner([
  internal.migrations.dropDeprecatedAssetProps,
  internal.migrations.dropDeprecatedFieldProps,
  internal.migrations.dropDeprecatedViewProps,
]);

export const dropDeprecatedAssetProps = migrations.define({
  table: "assets",
  migrateOne: () => ({
    mutex: undefined,
    mutexHolderId: undefined,
    mutedExpiresAt: undefined,
    editing: undefined,
    editingBy: undefined,
    editingLockExpires: undefined,
    vsphereMoid: undefined,
    vsphereMetadata: undefined,
  }),
});

export const dropDeprecatedFieldProps = migrations.define({
  table: "fields",
  migrateOne: () => ({
    editing: undefined,
    persistent: undefined,
  }),
});

export const dropDeprecatedViewProps = migrations.define({
  table: "views",
  migrateOne: () => ({
    fields: undefined,
    sortBy: undefined,
  }),
});
