/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as authProviders_customPassword from "../authProviders/customPassword.js";
import type * as crons from "../crons.js";
import type * as fields from "../fields.js";
import type * as files from "../files.js";
import type * as general from "../general.js";
import type * as http from "../http.js";
import type * as locks from "../locks.js";
import type * as system from "../system.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as views from "../views.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  "authProviders/customPassword": typeof authProviders_customPassword;
  crons: typeof crons;
  fields: typeof fields;
  files: typeof files;
  general: typeof general;
  http: typeof http;
  locks: typeof locks;
  system: typeof system;
  users: typeof users;
  utils: typeof utils;
  views: typeof views;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
