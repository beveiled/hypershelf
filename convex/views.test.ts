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
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

test("views editing", async () => {
  const t = convexTest(schema);
  const bob = await t.run(async ctx => {
    return await ctx.db.insert("users", { name: "Bob" });
  });

  const asBob = t.withIdentity({ name: "Bob", subject: bob });

  const createdView = await asBob.mutation(api.views.create, {
    name: "Test View"
  });
  expect(createdView).toBeDefined();

  const viewId = createdView as Id<"views">;
  expect(viewId).toBeDefined();

  const emptyViews = await t.query(api.views.get);
  expect(emptyViews.views).toHaveLength(0);

  await expect(async () => {
    await t.mutation(api.views.create, {
      name: "Unauthenticated View"
    });
  }).rejects.toThrowError("Unauthorized");

  await expect(async () => {
    await t.mutation(api.views.update, {
      viewId: viewId,
      fields: [],
      sortBy: undefined
    });
  }).rejects.toThrowError("Unauthorized");

  await expect(async () => {
    await t.mutation(api.views.remove, {
      viewId: viewId
    });
  }).rejects.toThrowError("Unauthorized");

  const view = await asBob.query(api.views.get);
  expect(view.views).toHaveLength(1);
  expect(view.views[0]._id).toEqual(viewId);
  expect(view.views[0].name).toEqual("Test View");

  const updatedView = await asBob.mutation(api.views.update, {
    viewId,
    fields: [],
    sortBy: undefined
  });
  expect(updatedView).toBeDefined();
  expect(updatedView._id).toEqual(viewId);

  const viewAfterUpdate = await asBob.query(api.views.get);
  expect(viewAfterUpdate.views).toHaveLength(1);
  expect(viewAfterUpdate.views[0]._id).toEqual(viewId);
  expect(viewAfterUpdate.views[0].name).toEqual("Test View");

  const deleteView = await asBob.mutation(api.views.remove, {
    viewId
  });
  expect(deleteView).toBeDefined();

  const viewAfterDelete = await asBob.query(api.views.get);
  expect(viewAfterDelete.views).toHaveLength(0);
  expect(viewAfterDelete.views.some(v => v._id === viewId)).toBe(false);

  await expect(async () => {
    await asBob.mutation(api.views.remove, {
      viewId: viewId
    });
  }).rejects.toThrowError("View not found");

  await expect(async () => {
    await asBob.mutation(api.views.update, {
      viewId: viewId,
      fields: [],
      sortBy: undefined
    });
  }).rejects.toThrowError("View not found");
});
