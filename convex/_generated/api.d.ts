/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chats_actions from "../chats_actions.js";
import type * as chats_guards from "../chats_guards.js";
import type * as chats_helpers from "../chats_helpers.js";
import type * as chats_mutations from "../chats_mutations.js";
import type * as chats_queries from "../chats_queries.js";
import type * as chats_schema from "../chats_schema.js";
import type * as http from "../http.js";
import type * as http_chat from "../http_chat.js";
import type * as lib from "../lib.js";
import type * as messages_guards from "../messages_guards.js";
import type * as messages_helpers from "../messages_helpers.js";
import type * as messages_internals from "../messages_internals.js";
import type * as messages_mutations from "../messages_mutations.js";
import type * as messages_queries from "../messages_queries.js";
import type * as messages_schema from "../messages_schema.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chats_actions: typeof chats_actions;
  chats_guards: typeof chats_guards;
  chats_helpers: typeof chats_helpers;
  chats_mutations: typeof chats_mutations;
  chats_queries: typeof chats_queries;
  chats_schema: typeof chats_schema;
  http: typeof http;
  http_chat: typeof http_chat;
  lib: typeof lib;
  messages_guards: typeof messages_guards;
  messages_helpers: typeof messages_helpers;
  messages_internals: typeof messages_internals;
  messages_mutations: typeof messages_mutations;
  messages_queries: typeof messages_queries;
  messages_schema: typeof messages_schema;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
