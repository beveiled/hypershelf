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
import type * as lib_env from "../lib/env.js";
import type * as lib_integrations_vsphere_SoapClient from "../lib/integrations/vsphere/SoapClient.js";
import type * as lib_integrations_vsphere__debug from "../lib/integrations/vsphere/_debug.js";
import type * as lib_integrations_vsphere_consts from "../lib/integrations/vsphere/consts.js";
import type * as lib_integrations_vsphere_index from "../lib/integrations/vsphere/index.js";
import type * as lib_integrations_vsphere_parseFolders from "../lib/integrations/vsphere/parseFolders.js";
import type * as lib_integrations_vsphere_parseInventory from "../lib/integrations/vsphere/parseInventory.js";
import type * as lib_integrations_vsphere_types from "../lib/integrations/vsphere/types.js";
import type * as lib_integrations_vsphere_utils from "../lib/integrations/vsphere/utils.js";
import type * as lib_redis_index from "../lib/redis/index.js";
import type * as locks from "../locks.js";
import type * as system from "../system.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as views from "../views.js";
import type * as vsphere from "../vsphere.js";
import type * as vsphereNode from "../vsphereNode.js";

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
  "lib/env": typeof lib_env;
  "lib/integrations/vsphere/SoapClient": typeof lib_integrations_vsphere_SoapClient;
  "lib/integrations/vsphere/_debug": typeof lib_integrations_vsphere__debug;
  "lib/integrations/vsphere/consts": typeof lib_integrations_vsphere_consts;
  "lib/integrations/vsphere/index": typeof lib_integrations_vsphere_index;
  "lib/integrations/vsphere/parseFolders": typeof lib_integrations_vsphere_parseFolders;
  "lib/integrations/vsphere/parseInventory": typeof lib_integrations_vsphere_parseInventory;
  "lib/integrations/vsphere/types": typeof lib_integrations_vsphere_types;
  "lib/integrations/vsphere/utils": typeof lib_integrations_vsphere_utils;
  "lib/redis/index": typeof lib_redis_index;
  locks: typeof locks;
  system: typeof system;
  users: typeof users;
  utils: typeof utils;
  views: typeof views;
  vsphere: typeof vsphere;
  vsphereNode: typeof vsphereNode;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
