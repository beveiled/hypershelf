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
import schema from "./schema";

test("users", async () => {
  const t = convexTest(schema);
  const bob = await t.run(async ctx => {
    return await ctx.db.insert("users", { name: "Bob" });
  });

  const asBob = t.withIdentity({ name: "Bob", subject: bob });
  const users = await asBob.query(api.users.getAll);
  expect(users.users).toHaveLength(1);
  expect(users.users[0].id).toEqual(bob);
  expect(users.users[0].name).toEqual("Bob");

  const usersNoAuth = await t.query(api.users.getAll);
  expect(usersNoAuth.users).toHaveLength(0);
});
