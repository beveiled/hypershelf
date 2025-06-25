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
import { httpRouter } from "convex/server";
import { auth } from "./auth";

import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/getfile",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId")! as Id<"files">;
    const file = await ctx.runQuery(api.files.getMetadata, { fileId });
    if (!file) {
      return new Response("File not found", {
        status: 404
      });
    }
    const blob = await ctx.storage.get(file.storageId);
    if (blob === null) {
      return new Response("File not found", {
        status: 404
      });
    }
    return new Response(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Expose-Headers": "Content-Disposition",
        Vary: "origin"
      }
    });
  })
});

http.route({
  path: "/getfile",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400"
        })
      });
    } else {
      return new Response();
    }
  })
});

auth.addHttpRoutes(http);

export default http;
