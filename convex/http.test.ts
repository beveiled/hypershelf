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
import { Id } from "./_generated/dataModel";

test("http file api", async () => {
  const t = convexTest(schema);
  const authenticated = t.withIdentity({ name: "Bobby" });

  const fileUploadUrl = await authenticated.mutation(
    api.files.generateUploadUrl
  );
  expect(fileUploadUrl).toBeDefined();

  const storageId = await t.run(async ctx => {
    return await ctx.storage.store(new Blob(["Hello, world!"]));
  });
  expect(storageId).toBeDefined();

  const { fileId } = await authenticated.mutation(api.files.attachMetadata, {
    storageId: storageId,
    fileName: "test.txt"
  });
  expect(fileId).toBeDefined();

  const file = await t.fetch(`/getfile?fileId=${fileId}`);
  expect(file.status).toBe(200);
  const blob = await file.blob();
  expect(blob).toBeDefined();
  const text = await blob.text();
  expect(text).toBe("Hello, world!");

  const preflightResponse = await t.fetch(`/getfile?fileId=${fileId}`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Content-Type"
    }
  });
  expect(preflightResponse.status).toBe(200);
  expect(preflightResponse.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://localhost"
  );
  expect(preflightResponse.headers.get("Access-Control-Allow-Headers")).toBe(
    "Content-Type, Digest"
  );

  const invalidPreflight = await t.fetch(`/getfile?fileId=${fileId}`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost",
      "Access-Control-Request-Method": "POST"
    }
  });
  expect(invalidPreflight.status).toBe(200);
  expect(
    invalidPreflight.headers.get("Access-Control-Allow-Origin")
  ).toBeNull();

  await t.run(async ctx => {
    await ctx.storage.delete(storageId);
  });

  const fileNotInStorage = await t.fetch(`/getfile?fileId=${fileId}`);
  expect(fileNotInStorage.status).toBe(404);
  expect(await fileNotInStorage.text()).toBe("File not found");

  await t.run(async ctx => {
    await ctx.db.delete(fileId as Id<"files">);
  });

  await expect(async () => {
    await t.fetch(`/getfile?fileId=${fileId}`);
  }).rejects.toThrowError("File not found");
});
