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
import { convexTest, TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

const register = async (t: TestConvex<typeof schema>): Promise<Id<"users">> => {
  return await t.run(async ctx => {
    return await ctx.db.insert("users", {
      name: Math.random().toString(36).substring(2, 15)
    });
  });
};

test("asset locks", async () => {
  const t = convexTest(schema);
  const bob = await register(t);
  const alice = await register(t);
  const asBob = t.withIdentity({ name: "Bob", subject: bob });
  const asAlice = t.withIdentity({ name: "Alice", subject: alice });

  const createdField = await asBob.mutation(api.fields.createField, {
    name: "Test String",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing strings",
      placeholder: "Enter a string",
      regex: "^[a-zA-Z]+$",
      regexError: "Only letters are allowed",
      minLength: 2,
      maxLength: 50,
      icon: "text"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test String added"]
  });

  const unauthedCreateAsset = await t.mutation(api.assets.createAsset, {
    metadata: {}
  });
  expect(unauthedCreateAsset).toMatchObject({
    success: false,
    errors: { _: "Not authenticated" },
    _logs: ["Failed to create asset: not authenticated"]
  });

  const unauthedGetAllAssets = await t.query(api.assets.getAll);
  expect(unauthedGetAllAssets).toMatchObject({
    viewer: null,
    assets: []
  });

  const invalidCreate = await asBob.mutation(api.assets.createAsset, {});
  expect(invalidCreate).toMatchObject({
    success: false,
    errors: { _: "Metadata is required" },
    _logs: ["Failed to create asset: metadata is required"]
  });

  const createdAsset = await asBob.mutation(api.assets.createAsset, {
    metadata: {}
  });
  expect(createdAsset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });

  const unauthedDeleteAsset = await t.mutation(api.assets.deleteAsset, {
    id: createdAsset.assetId!
  });
  expect(unauthedDeleteAsset).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to delete asset: not authenticated"]
  });

  const unauthedUpdateAsset = await t.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(unauthedUpdateAsset).toMatchObject({
    success: false,
    errors: { _: "Not authenticated" },
    _logs: ["Failed to update asset: not authenticated"]
  });

  const unauthedAcquireLock = await t.mutation(api.assets.acquireLock, {
    id: createdAsset.assetId!
  });
  expect(unauthedAcquireLock).toMatchObject({
    success: false,
    _logs: ["Failed to acquire asset lock: not authenticated"]
  });

  const unauthedReleaseLock = await t.mutation(api.assets.releaseLock, {
    id: createdAsset.assetId!
  });
  expect(unauthedReleaseLock).toMatchObject({
    success: false,
    _logs: ["Failed to release asset lock: not authenticated"]
  });

  const unauthedRenewLock = await t.mutation(api.assets.renewLock, {
    id: createdAsset.assetId!
  });
  expect(unauthedRenewLock).toMatchObject({
    success: false,
    _logs: ["Failed to renew asset lock: not authenticated"]
  });

  const getAll = await asBob.query(api.assets.getAll);
  expect(getAll).toMatchObject({
    viewer: bob,
    assets: [
      {
        asset: {
          _id: createdAsset.assetId!,
          metadata: {}
        },
        editingBy: null
      }
    ]
  });

  const lockAsset = await asBob.mutation(api.assets.acquireLock, {
    id: createdAsset.assetId!
  });
  expect(lockAsset).toMatchObject({
    success: true,
    _logs: ["Asset lock acquired"]
  });

  const getAllWithEditing = await asBob.query(api.assets.getAll);
  expect(getAllWithEditing).toMatchObject({
    viewer: bob,
    assets: [
      {
        asset: {
          _id: createdAsset.assetId!,
          metadata: {}
        },
        editingBy: {
          _id: bob
        }
      }
    ]
  });

  const lockConflict = await asAlice.mutation(api.assets.acquireLock, {
    id: createdAsset.assetId!
  });
  expect(lockConflict).toMatchObject({
    success: false,
    error: "Asset is already being edited by another user",
    _logs: [`Failed to acquire asset lock: already being edited`]
  });

  const releaseConflict = await asAlice.mutation(api.assets.releaseLock, {
    id: createdAsset.assetId!
  });
  expect(releaseConflict).toMatchObject({
    success: false,
    error: "Asset is not being edited by you",
    _logs: ["Failed to release asset lock: not owned by caller"]
  });

  const renewConflict = await asAlice.mutation(api.assets.renewLock, {
    id: createdAsset.assetId!
  });
  expect(renewConflict).toMatchObject({
    success: false,
    error: "Asset is not being edited by you",
    _logs: ["Failed to renew asset lock: not owned by caller"]
  });

  const renew = await asBob.mutation(api.assets.renewLock, {
    id: createdAsset.assetId!
  });
  expect(renew).toMatchObject({
    success: true,
    _logs: ["Asset lock renewed"]
  });

  const editAttempt = await asAlice.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {
      [createdField.fieldId! as string]: "Somevalue"
    }
  });
  expect(editAttempt).toMatchObject({
    success: false,
    errors: { _: "Asset is not being edited by you" },
    _logs: ["Failed to update asset: not being edited by you"]
  });

  const validEditAttempt = await asBob.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {
      [createdField.fieldId! as string]: "Somevalue"
    }
  });
  expect(validEditAttempt).toMatchObject({
    success: true,
    _logs: ["Asset updated successfully"]
  });

  const invalidEditAttempt = await asBob.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {
      [createdField.fieldId! as string]: "12345"
    }
  });
  expect(invalidEditAttempt).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId! as string]: "Only letters are allowed"
    }
  });

  const releasedLock = await asBob.mutation(api.assets.releaseLock, {
    id: createdAsset.assetId!
  });
  expect(releasedLock).toMatchObject({
    success: true,
    _logs: ["Asset lock released"]
  });

  const deleteField = await asBob.mutation(api.fields.deleteField, {
    fieldId: createdField.fieldId!
  });
  expect(deleteField).toMatchObject({
    success: true,
    _logs: ["Field Test String deleted"]
  });

  const createNonExistingField = await asBob.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId!]: "Test Value"
    }
  });
  expect(createNonExistingField).toMatchObject({
    success: false,
    errors: { _: "Unknown error" },
    _logs: ["Failed to fetch fields"]
  });

  const updateNonExistingField = await asBob.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {
      [createdField.fieldId!]: "New Value"
    }
  });
  expect(updateNonExistingField).toMatchObject({
    success: false,
    errors: { _: "Unknown error" },
    _logs: ["Failed to fetch fields"]
  });

  const updateNoLock = await asBob.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(updateNoLock).toMatchObject({
    success: true,
    _logs: ["Asset updated successfully", "Warning: lock missing"]
  });

  const deleteAsset = await asBob.mutation(api.assets.deleteAsset, {
    id: createdAsset.assetId!
  });
  expect(deleteAsset).toMatchObject({
    success: true,
    _logs: ["Asset deleted successfully"]
  });

  const acquireMissing = await asBob.mutation(api.assets.acquireLock, {
    id: createdAsset.assetId!
  });
  expect(acquireMissing).toMatchObject({
    success: false,
    error: "Asset not found",
    _logs: ["Failed to acquire asset lock: asset not found"]
  });

  const releaseMissing = await asBob.mutation(api.assets.releaseLock, {
    id: createdAsset.assetId!
  });
  expect(releaseMissing).toMatchObject({
    success: false,
    error: "Asset not found",
    _logs: ["Failed to release asset lock: asset not found"]
  });

  const renewMissing = await asBob.mutation(api.assets.renewLock, {
    id: createdAsset.assetId!
  });
  expect(renewMissing).toMatchObject({
    success: false,
    error: "Asset not found",
    _logs: ["Failed to renew asset lock: asset not found"]
  });

  const updateMissing = await asBob.mutation(api.assets.updateAsset, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(updateMissing).toMatchObject({
    success: false,
    errors: { _: "Asset not found" },
    _logs: ["Failed to update asset: asset not found"]
  });

  const deleteMissing = await asBob.mutation(api.assets.deleteAsset, {
    id: createdAsset.assetId!
  });
  expect(deleteMissing).toMatchObject({
    success: false,
    error: "Asset not found",
    _logs: ["Failed to delete asset: asset not found"]
  });
});
