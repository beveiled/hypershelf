import { httpRouter } from "convex/server";

import type { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

http.route({
  pathPrefix: "/getfile/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const parts = request.url.split("/");
    const fileId = parts[parts.length - 1]?.split(".")[0] as
      | Id<"files">
      | undefined;
    if (!fileId) {
      return new Response("Bad request", {
        status: 400,
      });
    }

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
        "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
        "Access-Control-Expose-Headers": "Content-Disposition",
        Vary: "origin",
      },
    });
  }),
});

http.route({
  pathPrefix: "/getfile/",
  method: "OPTIONS",
  // eslint-disable-next-line @typescript-eslint/require-await
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

http.route({
  path: "/ingestSigil",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const sigil = request.headers.get("x-sigil");
    if (!sigil) {
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
    const token = await ctx.runAction(api.auth.signIn, {
      provider: "sigil",
      params: { sigil },
    });
    if (!token.tokens) {
      return new Response(JSON.stringify({ ok: false }), { status: 401 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        token: token.tokens.token,
        refreshToken: token.tokens.refreshToken,
      }),
      { status: 200 },
    );
  }),
});

http.route({
  pathPrefix: "/markdown/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const parts = request.url.split("/");
    const assetId = parts[parts.length - 2] as Id<"assets"> | undefined;
    const fieldId = parts[parts.length - 1] as Id<"fields"> | undefined;
    if (!assetId || !fieldId) {
      return new Response("Bad request", {
        status: 400,
      });
    }

    const value = await ctx.runQuery(internal.assets.getMarkdown, {
      assetId,
      fieldId,
    });
    if (!value.content) {
      return new Response("Not found", {
        status: 404,
      });
    }

    return new Response(value.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }),
});

auth.addHttpRoutes(http);

export default http;
