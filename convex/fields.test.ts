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

test("string field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
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
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "HelloWorld"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "H1"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: { [createdField.fieldId as string]: "Only letters are allowed" }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]:
        "A very long string that exceeds the maximum allowed length"
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "String must contain at most 50 character(s)"
    }
  });
  const invalidAsset3 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "A"
    }
  });
  expect(invalidAsset3).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "String must contain at least 2 character(s)"
    }
  });

  const createFieldNoRegexError = await authenticated.mutation(
    api.fields.createField,
    {
      name: "Test String No Regex Error",
      type: "string",
      required: true,
      extra: {
        description: "A field for testing strings without regex error",
        placeholder: "Enter a string",
        minLength: 2,
        maxLength: 50,
        regex: "^[a-zA-Z]+$"
      }
    }
  );
  expect(createFieldNoRegexError).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test String No Regex Error added"]
  });
  const assetNoRegexError = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [createFieldNoRegexError.fieldId as string]: "Hello World"
      }
    }
  );
  expect(assetNoRegexError).toMatchObject({
    success: false,
    errors: {
      [createFieldNoRegexError.fieldId as string]:
        "Value does not match the regex"
    }
  });
});

test("number field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Number",
    type: "number",
    required: true,
    extra: {
      description: "A field for testing numbers",
      placeholder: "Enter a number",
      minValue: 0,
      maxValue: 100
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Number added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: 42
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: -1
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Number must be greater than or equal to 0"
    }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: 101
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Number must be less than or equal to 100"
    }
  });
});

test("field type coerce", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Coerce",
    type: "number",
    required: true,
    extra: {
      description: "A field for testing coercion",
      placeholder: "Enter a number"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Coerce added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "42"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "not-a-number"
    }
  });
  expect(invalidAsset).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]: "Value must be a number"
    }
  });
});

test("boolean field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Boolean",
    type: "boolean",
    required: true,
    extra: {
      description: "A field for testing boolean values"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Boolean added"]
  });
  const assetTrue = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: true
    }
  });
  expect(assetTrue).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const assetFalse = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: false
    }
  });
  expect(assetFalse).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
});

test("email field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Email",
    type: "email",
    required: true,
    extra: {
      description: "A field for testing email addresses",
      placeholder: "Enter an email"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Email added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "test@localhost.com"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "invalid-email"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: { [createdField.fieldId as string]: "Invalid email" }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "ઇમેઇલ"
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: { [createdField.fieldId as string]: "Invalid email" }
  });
});

test("url field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test URL",
    type: "url",
    required: true,
    extra: {
      description: "A field for testing URLs",
      placeholder: "Enter a URL"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test URL added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "https://example.com"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "invalid-url"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: { [createdField.fieldId as string]: "Invalid URL" }
  });
});

test("select field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Select",
    type: "select",
    required: true,
    extra: {
      description: "A field for testing select options",
      options: ["Option 1", "Option 2", "Option 3"]
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Select added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "Option 1"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "Invalid Option"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Invalid enum value. Expected 'Option 1' | 'Option 2' | 'Option 3', received 'Invalid Option'"
    }
  });
});

test("date field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Date",
    type: "date",
    required: true,
    extra: {
      description: "A field for testing dates",
      placeholder: "Select a date"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Date added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: new Date("2023-10-01").toISOString()
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "invalid-date"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: { [createdField.fieldId as string]: "Invalid date" }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: 0
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]: "Expected date, received number"
    }
  });
});

test("ip field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test IP",
    type: "ip",
    required: false,
    extra: {
      description: "A field for testing IP addresses",
      placeholder: "Enter an IP address",
      subnet: "10.10.10.10/24"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test IP added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "10.10.10.40"
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "11.11.11.11"
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "IP address must be in subnet 10.10.10.10/24"
    }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "invalid-ip"
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "IP address must be in subnet 10.10.10.10/24"
    }
  });
  const invalidAsset3 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: "10.10.10.256"
    }
  });
  expect(invalidAsset3).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "IP address must be in subnet 10.10.10.10/24"
    }
  });
});

test("array field validators", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Array",
    type: "array",
    required: true,
    extra: {
      description: "A field for testing arrays",
      listObjectType: "number",
      listObjectExtra: { maxValue: 100, minValue: 0 },
      minItems: 1,
      maxItems: 5
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Array added"]
  });
  const asset = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: [1, 2]
    }
  });
  expect(asset).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAsset1 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: []
    }
  });
  expect(invalidAsset1).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Array must contain at least 1 element(s)"
    }
  });
  const invalidAsset2 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: [1, 2, 3, 4, 5, 6]
    }
  });
  expect(invalidAsset2).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Array must contain at most 5 element(s)"
    }
  });
  const invalidAsset3 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: ["Invalid", 1, 2]
    }
  });
  expect(invalidAsset3).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]: "Value must be a number"
    }
  });
  const invalidAsset4 = await authenticated.mutation(api.assets.createAsset, {
    metadata: {
      [createdField.fieldId as string]: [101]
    }
  });
  expect(invalidAsset4).toMatchObject({
    success: false,
    errors: {
      [createdField.fieldId as string]:
        "Number must be less than or equal to 100"
    }
  });

  const fieldArrayNoSubtype = await authenticated.mutation(
    api.fields.createField,
    {
      name: "Test Array No Subtype",
      type: "array",
      required: true,
      extra: {
        description: "A field for testing arrays without subtype",
        minItems: 1,
        maxItems: 5
      }
    }
  );
  expect(fieldArrayNoSubtype).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Array No Subtype added"]
  });
  const assetArrayNoSubtype = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [fieldArrayNoSubtype.fieldId as string]: ["Hello", "World"]
      }
    }
  );
  expect(assetArrayNoSubtype).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
  const invalidAssetArrayNoSubtype = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [fieldArrayNoSubtype.fieldId as string]: []
      }
    }
  );
  expect(invalidAssetArrayNoSubtype).toMatchObject({
    success: false,
    errors: {
      [fieldArrayNoSubtype.fieldId as string]:
        "Array must contain at least 1 element(s)"
    }
  });
  const invalidAssetArrayNoSubtype2 = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [fieldArrayNoSubtype.fieldId as string]: [
          "Hello",
          "World",
          "Test",
          "Array",
          "No",
          "Subtype"
        ]
      }
    }
  );
  expect(invalidAssetArrayNoSubtype2).toMatchObject({
    success: false,
    errors: {
      [fieldArrayNoSubtype.fieldId as string]:
        "Array must contain at most 5 element(s)"
    }
  });
  const invalidAssetArrayNoSubtype3 = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [fieldArrayNoSubtype.fieldId as string]: [1, 2, 3, 4, 5, 6]
      }
    }
  );
  expect(invalidAssetArrayNoSubtype3).toMatchObject({
    success: false,
    errors: {
      [fieldArrayNoSubtype.fieldId as string]:
        "Expected string, received number"
    }
  });
});

test("non-zod error handling", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });
  const createdField = await authenticated.mutation(api.fields.createField, {
    name: "Test Non-Zod Error",
    type: "ip",
    required: true,
    extra: {
      description: "A field for testing non-zod errors",
      placeholder: "Enter an IP address",
      subnet: "11.11.11.11/35"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Non-Zod Error added"]
  });
  await expect(async () => {
    await authenticated.mutation(api.assets.createAsset, {
      metadata: {
        [createdField.fieldId as string]: "11.11.11.11"
      }
    });
  }).rejects.toThrow("Invalid subnet prefix");

  const createFieldNoSubnet = await authenticated.mutation(
    api.fields.createField,
    {
      name: "Test Field No Subnet",
      type: "ip",
      required: true,
      extra: {
        description: "A field for testing IP addresses without subnet",
        placeholder: "Enter an IP address",
        subnet: "11.11.11.11"
      }
    }
  );
  expect(createFieldNoSubnet).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Field No Subnet added"]
  });
  await expect(async () => {
    await authenticated.mutation(api.assets.createAsset, {
      metadata: {
        [createFieldNoSubnet.fieldId as string]: "11.11.11.11"
      }
    });
  }).rejects.toThrow("Invalid subnet");

  const createFieldZeroSubnet = await authenticated.mutation(
    api.fields.createField,
    {
      name: "Test Field Zero Subnet",
      type: "ip",
      required: true,
      extra: {
        description: "A field for testing IP addresses with zero subnet",
        placeholder: "Enter an IP address",
        subnet: "11.11.11.11/0"
      }
    }
  );
  expect(createFieldZeroSubnet).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Field Zero Subnet added"]
  });
  const createdAssetZeroSubnet = await authenticated.mutation(
    api.assets.createAsset,
    {
      metadata: {
        [createFieldZeroSubnet.fieldId as string]: "11.11.11.11"
      }
    }
  );
  expect(createdAssetZeroSubnet).toMatchObject({
    success: true,
    assetId: expect.any(String),
    _logs: ["Asset created successfully"]
  });
});

const register = async (t: TestConvex<typeof schema>): Promise<Id<"users">> => {
  return await t.run(async ctx => {
    const res = await ctx.db.insert("users", {
      name: Math.random().toString(36).substring(2, 15)
    });
    return res;
  });
};

test("field locks", async () => {
  const t = convexTest(schema);
  const bob = await register(t);
  const alice = await register(t);
  const asBob = t.withIdentity({ name: "Bob", subject: bob });
  const asAlice = t.withIdentity({ name: "Alice", subject: alice });

  const createdField = await asBob.mutation(api.fields.createField, {
    name: "Test Lock...",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(createdField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Lock... added"]
  });

  const editedNoLock = await asAlice.mutation(api.fields.updateField, {
    fieldId: createdField.fieldId!,
    name: "Test Lock",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(editedNoLock).toMatchObject({
    success: true,
    _logs: ["Field Test Lock... saved", "Warning: lock missing"]
  });

  const persistentField = await asBob.mutation(api.fields.createField, {
    name: "Test Persistent",
    type: "string",
    required: true
  });
  expect(persistentField).toMatchObject({
    success: true,
    fieldId: expect.any(String),
    _logs: ["Field Test Persistent added"]
  });

  const makePersistent = await asBob.mutation(api.fields.makePersistent, {
    fieldId: persistentField.fieldId!
  });
  expect(makePersistent).toMatchObject({
    success: true,
    _logs: ["Field Test Persistent made persistent"]
  });

  const makePersistent2 = await asBob.mutation(api.fields.makePersistent, {
    fieldId: persistentField.fieldId!
  });
  expect(makePersistent2).toMatchObject({
    success: false,
    error: "Field is already persistent",
    _logs: ["Field Test Persistent is already persistent"]
  });

  const lockField = await asBob.mutation(api.fields.acquireLock, {
    id: createdField.fieldId!
  });
  expect(lockField).toMatchObject({
    success: true,
    _logs: ["Lock acquired for Test Lock"]
  });

  const renewedLock = await asBob.mutation(api.fields.renewLock, {
    id: createdField.fieldId!
  });
  expect(renewedLock).toMatchObject({
    success: true,
    _logs: ["Lock renewed for Test Lock"]
  });

  const editAttempt = await asAlice.mutation(api.fields.updateField, {
    fieldId: createdField.fieldId!,
    name: "Test Lock v2",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(editAttempt).toMatchObject({
    success: false,
    error: "Field is not being edited by you",
    _logs: ["Failed to update field Test Lock: not being edited by you"]
  });

  const getAllWithEditors = await asBob.query(api.fields.getAll);
  expect(getAllWithEditors).toBeDefined();
  expect(getAllWithEditors.fields).toHaveLength(2);
  expect(getAllWithEditors.fields[0].field._id).toBe(createdField.fieldId!);
  expect(getAllWithEditors.fields[0].editingBy).toBeTruthy();
  expect(getAllWithEditors.fields[0].editingBy!._id).toBe(bob);

  const releaseLockAttempt = await asAlice.mutation(api.fields.releaseLock, {
    id: createdField.fieldId!
  });
  expect(releaseLockAttempt).toMatchObject({
    success: false,
    error: "Field is not being edited by you",
    _logs: ["Failed to release lock for Test Lock: not being edited by you"]
  });

  const acquireLockAttempt = await asAlice.mutation(api.fields.acquireLock, {
    id: createdField.fieldId!
  });
  expect(acquireLockAttempt).toMatchObject({
    success: false,
    error: "Field is already being edited by another user",
    _logs: [
      "Failed to acquire lock for Test Lock: already being edited by another user"
    ]
  });

  const renewLock = await asAlice.mutation(api.fields.renewLock, {
    id: createdField.fieldId!
  });
  expect(renewLock).toMatchObject({
    success: false,
    error: "Field is not being edited by you",
    _logs: ["Failed to renew lock for Test Lock: not being edited by you"]
  });

  const conflict = await asAlice.mutation(api.fields.deleteField, {
    fieldId: createdField.fieldId!
  });
  expect(conflict).toMatchObject({
    success: false,
    error: "Field is being edited by another user",
    _logs: ["Failed to delete field Test Lock: being edited by another user"]
  });

  const validEditAttempt = await asBob.mutation(api.fields.updateField, {
    fieldId: createdField.fieldId!,
    name: "Test Lock v2",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(validEditAttempt).toMatchObject({
    success: true,
    _logs: ["Field Test Lock saved"]
  });

  const releasedLock = await asBob.mutation(api.fields.releaseLock, {
    id: createdField.fieldId!
  });
  expect(releasedLock).toMatchObject({
    success: true,
    _logs: ["Lock released for Test Lock v2"]
  });

  const createField = await t.mutation(api.fields.createField, {
    name: "Test Non-Authenticated",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing non-authenticated access",
      placeholder: "Enter a string"
    }
  });
  expect(createField).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to add field: not authenticated"]
  });

  const updateField = await t.mutation(api.fields.updateField, {
    fieldId: createdField.fieldId!,
    name: "Test Update Non-Authenticated",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing non-authenticated access",
      placeholder: "Enter a string"
    }
  });
  expect(updateField).toMatchObject({
    success: false,
    error: "Not authenticated"
  });

  const acquireLock = await t.mutation(api.fields.acquireLock, {
    id: createdField.fieldId!
  });
  expect(acquireLock).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to acquire lock: not authenticated"]
  });

  const releaseLock = await t.mutation(api.fields.releaseLock, {
    id: createdField.fieldId!
  });
  expect(releaseLock).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to release lock: not authenticated"]
  });

  const deleteFieldAttempt = await t.mutation(api.fields.deleteField, {
    fieldId: createdField.fieldId!
  });
  expect(deleteFieldAttempt).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to delete field: not authenticated"]
  });

  const renewLockAttempt = await t.mutation(api.fields.renewLock, {
    id: createdField.fieldId!
  });
  expect(renewLockAttempt).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to renew lock: not authenticated"]
  });

  const persistentAttempt = await t.mutation(api.fields.makePersistent, {
    fieldId: createdField.fieldId!
  });
  expect(persistentAttempt).toMatchObject({
    success: false,
    error: "Not authenticated",
    _logs: ["Failed to make field persistent: not authenticated"]
  });

  const getAllFields = await t.query(api.fields.getAll);
  expect(getAllFields).toMatchObject({
    fields: [],
    viewer: null
  });

  const getAllFieldsValid = await asBob.query(api.fields.getAll);
  expect(getAllFieldsValid).toBeDefined();
  expect(getAllFieldsValid.fields).toHaveLength(2);

  const deleteField = await asBob.mutation(api.fields.deleteField, {
    fieldId: createdField.fieldId!
  });
  expect(deleteField).toMatchObject({
    success: true,
    _logs: ["Field Test Lock v2 deleted"]
  });

  const notFoundField = await asBob.mutation(api.fields.deleteField, {
    fieldId: createdField.fieldId!
  });
  expect(notFoundField).toMatchObject({
    success: false,
    error: "Field not found",
    _logs: ["Failed to delete field: field not found"]
  });

  const lockNotFound = await asBob.mutation(api.fields.acquireLock, {
    id: createdField.fieldId!
  });
  expect(lockNotFound).toMatchObject({
    success: false,
    error: "Field not found",
    _logs: ["Failed to acquire lock: field not found"]
  });

  const releaseNotFound = await asBob.mutation(api.fields.releaseLock, {
    id: createdField.fieldId!
  });
  expect(releaseNotFound).toMatchObject({
    success: false,
    error: "Field not found",
    _logs: ["Failed to release lock: field not found"]
  });

  const renewNotFound = await asBob.mutation(api.fields.renewLock, {
    id: createdField.fieldId!
  });
  expect(renewNotFound).toMatchObject({
    success: false,
    error: "Field not found",
    _logs: ["Failed to renew lock: field not found"]
  });

  const updateNotFound = await asBob.mutation(api.fields.updateField, {
    fieldId: createdField.fieldId!,
    name: "Test Lock v3",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(updateNotFound).toMatchObject({
    success: false,
    error: "Field not found"
  });

  const persistentNotFound = await asBob.mutation(api.fields.makePersistent, {
    fieldId: createdField.fieldId!
  });
  expect(persistentNotFound).toMatchObject({
    success: false,
    error: "Field not found",
    _logs: ["Failed to make field persistent: field not found"]
  });
});
