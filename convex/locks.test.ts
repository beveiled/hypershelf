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
    const res = await ctx.db.insert("users", {
      name: Math.random().toString(36).substring(2, 15)
    });
    return res;
  });
};

test("locks", async () => {
  const t = convexTest(schema);
  const bob = await register(t);
  const alice = await register(t);
  const asBob = t.withIdentity({ name: "Bob", subject: bob });
  const asAlice = t.withIdentity({ name: "Alice", subject: alice });

  const createdField = await asBob.mutation(api.fields.create, {
    name: "Test Lock...",
    type: "string",
    required: true,
    extra: {
      description: "A field for testing locks",
      placeholder: "Enter a string"
    }
  });
  expect(createdField).toBeDefined();
  expect(createdField.success).toBe(true);

  const fieldId = createdField.fieldId as Id<"fields">;

  const acquireNoAuth = await t.mutation(api.locks.acquire, {
    id: fieldId
  });
  expect(acquireNoAuth.success).toBe(false);

  const releaseNoAuth = await t.mutation(api.locks.release, {
    id: fieldId
  });
  expect(releaseNoAuth.success).toBe(false);

  const renewNoAuth = await t.mutation(api.locks.renew, {
    id: fieldId
  });
  expect(renewNoAuth.success).toBe(false);

  const acquire = await asBob.mutation(api.locks.acquire, {
    id: fieldId
  });
  expect(acquire.success).toBe(true);

  const renew = await asBob.mutation(api.locks.renew, {
    id: fieldId
  });
  expect(renew.success).toBe(true);

  const acquireConflict = await asAlice.mutation(api.locks.acquire, {
    id: fieldId
  });
  expect(acquireConflict.success).toBe(false);

  const renewConflict = await asAlice.mutation(api.locks.renew, {
    id: fieldId
  });
  expect(renewConflict.success).toBe(false);

  const releaseConflict = await asAlice.mutation(api.locks.release, {
    id: fieldId
  });
  expect(releaseConflict.success).toBe(false);

  const release = await asBob.mutation(api.locks.release, {
    id: fieldId
  });
  expect(release.success).toBe(true);

  const removed = await asBob.mutation(api.fields.remove, {
    fieldId: fieldId
  });
  expect(removed.success).toBe(true);

  const acquireAfterRemove = await asBob.mutation(api.locks.acquire, {
    id: fieldId
  });
  expect(acquireAfterRemove.success).toBe(false);

  const releaseAfterRemove = await asBob.mutation(api.locks.release, {
    id: fieldId
  });
  expect(releaseAfterRemove.success).toBe(false);

  const renewAfterRemove = await asBob.mutation(api.locks.renew, {
    id: fieldId
  });
  expect(renewAfterRemove.success).toBe(false);
});
