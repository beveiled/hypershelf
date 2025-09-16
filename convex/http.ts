import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/getfile",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId")! as Id<"files">;
    const file = await ctx.runQuery(api.files.getMetadata, { fileId });
    const blob = await ctx.storage.get(file.storageId);
    if (blob === null) {
      return new Response("File not found", {
        status: 404,
      });
    }
    return new Response(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Expose-Headers": "Content-Disposition",
        Vary: "origin",
      },
    });
  }),
});

http.route({
  path: "/getfile",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    const origin = headers.get("Origin");
    if (
      origin !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

auth.addHttpRoutes(http);

export default http;
