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

  const createdField = await asBob.mutation(api.fields.create, {
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

  const unauthedCreateAsset = await t.mutation(api.assets.create, {
    metadata: {}
  });
  expect(unauthedCreateAsset).toMatchObject({
    success: false,
    errors: { _: "Not authenticated" },
    _logs: ["Failed to create asset: not authenticated"]
  });

  const unauthedGetAllAssets = await t.query(api.assets.get);
  expect(unauthedGetAllAssets).toMatchObject({
    assets: []
  });

  const invalidCreate = await asBob.mutation(api.assets.create, {});
  expect(invalidCreate).toMatchObject({
    success: false,
    errors: { _: "Metadata is required" },
    _logs: ["Failed to create asset: metadata is required"]
  });

  const createdAsset = await asBob.mutation(api.assets.create, {
    metadata: {}
  });
  expect(createdAsset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });

  const unauthedDeleteAsset = await t.mutation(api.assets.remove, {
    id: createdAsset.assetId!
  });
  expect(unauthedDeleteAsset).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to delete asset: not authenticated"]
  });

  const unauthedUpdateAsset = await t.mutation(api.assets.update, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(unauthedUpdateAsset).toMatchObject({
    success: false,
    errors: { _: "Not authenticated" },
    _logs: ["Failed to update asset: not authenticated"]
  });

  const getAll = await asBob.query(api.assets.get);
  expect(getAll).toMatchObject({
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

  const lockAsset = await asBob.mutation(api.locks.acquire, {
    id: createdAsset.assetId!
  });
  expect(lockAsset).toMatchObject({
    success: true,
    _logs: ["Lock acquired"]
  });

  const getAllWithEditing = await asBob.query(api.assets.get);
  expect(getAllWithEditing).toMatchObject({
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

  const editAttempt = await asAlice.mutation(api.assets.update, {
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

  const validEditAttempt = await asBob.mutation(api.assets.update, {
    assetId: createdAsset.assetId!,
    values: {
      [createdField.fieldId! as string]: "Somevalue"
    }
  });
  expect(validEditAttempt).toMatchObject({
    success: true,
    _logs: ["Asset updated successfully"]
  });

  const invalidEditAttempt = await asBob.mutation(api.assets.update, {
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

  const releasedLock = await asBob.mutation(api.locks.release, {
    id: createdAsset.assetId!
  });
  expect(releasedLock).toMatchObject({
    success: true,
    _logs: ["Lock released"]
  });

  const deleteField = await asBob.mutation(api.fields.remove, {
    fieldId: createdField.fieldId!
  });
  expect(deleteField).toMatchObject({
    success: true,
    _logs: ["Field Test String deleted"]
  });

  const createNonExistingField = await asBob.mutation(api.assets.create, {
    metadata: {
      [createdField.fieldId!]: "Test Value"
    }
  });
  expect(createNonExistingField).toMatchObject({
    success: false,
    errors: { _: "Unknown error" },
    _logs: ["Failed to fetch fields"]
  });

  const updateNonExistingField = await asBob.mutation(api.assets.update, {
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

  const updateNoLock = await asBob.mutation(api.assets.update, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(updateNoLock).toMatchObject({
    success: true,
    _logs: ["Asset updated successfully", "Warning: lock missing"]
  });

  const deleteAsset = await asBob.mutation(api.assets.remove, {
    id: createdAsset.assetId!
  });
  expect(deleteAsset).toMatchObject({
    success: true,
    _logs: ["Asset deleted successfully"]
  });

  const updateMissing = await asBob.mutation(api.assets.update, {
    assetId: createdAsset.assetId!,
    values: {}
  });
  expect(updateMissing).toMatchObject({
    success: false,
    errors: { _: "Asset not found" },
    _logs: ["Failed to update asset: asset not found"]
  });

  const deleteMissing = await asBob.mutation(api.assets.remove, {
    id: createdAsset.assetId!
  });
  expect(deleteMissing).toMatchObject({
    success: false,
    error: "Asset not found",
    _logs: ["Failed to delete asset: asset not found"]
  });
});
