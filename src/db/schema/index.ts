/**
 * Drizzle schema — Cellar Compass production data model.
 *
 * Design intent:
 *  - Multi-tenant: every content row keys back to a restaurant.
 *  - Localized fields stored as JSONB ({en, pl, ...}) so adding a 3rd
 *    language is data, not migration.
 *  - Auth piggy-backs on Auth.js v5's Drizzle adapter standard tables.
 *  - Analytics events are append-only, partition-friendly — even though
 *    Postgres-side partitioning is wired later, the rowstart shape is
 *    already correct.
 *
 * Naming: snake_case in DB, camelCase in TS (drizzle handles the bridge).
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  doublePrecision,
  numeric,
  boolean,
  primaryKey,
  bigserial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─────────────────────────  ENUMS  ─────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "guest"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "editor", "viewer"]);
export const wineBodyEnum = pgEnum("wine_body", ["light", "medium", "full"]);
export const wineAcidityEnum = pgEnum("wine_acidity", ["low", "medium", "high"]);
export const wineTanninEnum = pgEnum("wine_tannin", ["none", "soft", "medium", "high"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

// ─────────────────────────  AUTH.JS TABLES  ─────────────────────────
// Standard Auth.js v5 Drizzle adapter shape. Email is unique; magic-link
// auth uses verificationTokens.

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

// ─────────────────────────  RESTAURANTS (TENANTS)  ─────────────────────────

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    /** LocalizedString {en, pl} */
    name: jsonb("name").notNull(),
    /** LocalizedString */
    description: jsonb("description").notNull(),
    cuisine: text("cuisine").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    district: text("district").notNull(),
    coverGradient: text("cover_gradient").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    /** Public visibility — false during pilot setup. */
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("restaurants_slug_idx").on(t.slug),
    cityIdx: index("restaurants_city_idx").on(t.city),
  }),
);

export const restaurantMembers = pgTable(
  "restaurant_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("editor"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.restaurantId] }),
    rIdx: index("restaurant_members_restaurant_idx").on(t.restaurantId),
  }),
);

// ─────────────────────────  CONTENT  ─────────────────────────

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    /** Stable external slug if any (legacy seeded ids retained). */
    externalId: text("external_id"),
    name: jsonb("name").notNull(),
    description: jsonb("description").notNull(),
    category: text("category").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    restIdx: index("dishes_restaurant_idx").on(t.restaurantId),
    extIdx: index("dishes_external_idx").on(t.restaurantId, t.externalId),
  }),
);

export const wines = pgTable(
  "wines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    name: jsonb("name").notNull(),
    region: text("region").notNull(),
    grape: text("grape").notNull(),
    style: text("style").notNull(),
    vintage: text("vintage"),
    year: integer("year"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    rating: numeric("rating", { precision: 2, scale: 1 }),
    imageUrl: text("image_url"),
    notes: jsonb("notes").notNull(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    /** Wine passport — body/acidity/tannin/grape/abv/serving/decant. */
    body: wineBodyEnum("body").notNull().default("medium"),
    acidity: wineAcidityEnum("acidity").notNull().default("medium"),
    tannin: wineTanninEnum("tannin").notNull().default("medium"),
    abv: numeric("abv", { precision: 4, scale: 2 }),
    servingTempC: text("serving_temp_c"),
    decant: text("decant"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    restIdx: index("wines_restaurant_idx").on(t.restaurantId),
    extIdx: index("wines_external_idx").on(t.restaurantId, t.externalId),
  }),
);

export const curatedPairings = pgTable(
  "curated_pairings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    wineId: uuid("wine_id")
      .notNull()
      .references(() => wines.id, { onDelete: "cascade" }),
    /** LocalizedString reason */
    reason: jsonb("reason").notNull(),
    /** Optional score boost on top of algorithmic score (1..30). */
    boost: integer("boost").notNull().default(15),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pairUnique: uniqueIndex("curated_pairings_unique").on(t.restaurantId, t.dishId, t.wineId),
    restIdx: index("curated_pairings_restaurant_idx").on(t.restaurantId),
    dishIdx: index("curated_pairings_dish_idx").on(t.dishId),
  }),
);

// ─────────────────────────  GUEST TASTE PROFILES  ─────────────────────────

export const tasteProfiles = pgTable(
  "taste_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Anonymous identity stored in client localStorage; always present. */
    anonymousId: uuid("anonymous_id").notNull(),
    /** Set when user authenticates (rare for guests). */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Compass selection: { tendencjaId: 0..4 } */
    compass: jsonb("compass").notNull(),
    /** 3 base smaki: { slodycz, cierpkosc, kwasowosc: 0..4 } */
    baseTastes: jsonb("base_tastes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    anonIdx: index("taste_profiles_anon_idx").on(t.anonymousId),
    userIdx: index("taste_profiles_user_idx").on(t.userId),
  }),
);

// ─────────────────────────  ANALYTICS EVENTS  ─────────────────────────
// Append-only, indexed for OLAP-ish queries. `event_type` is an open string
// so we don't have to migrate when we add a new event — we keep a code-side
// allowlist constant for type safety. `props` is a free-form jsonb bag.

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    eventType: text("event_type").notNull(),
    restaurantId: uuid("restaurant_id").references(() => restaurants.id, {
      onDelete: "set null",
    }),
    dishId: uuid("dish_id").references(() => dishes.id, { onDelete: "set null" }),
    wineId: uuid("wine_id").references(() => wines.id, { onDelete: "set null" }),
    profileId: uuid("profile_id").references(() => tasteProfiles.id, {
      onDelete: "set null",
    }),
    sessionId: text("session_id"),
    anonymousId: uuid("anonymous_id"),
    /** Flexible per-event payload: { score, model, locale, ... }. */
    props: jsonb("props").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    tsIdx: index("events_ts_idx").on(t.ts),
    typeIdx: index("events_type_idx").on(t.eventType, t.ts),
    restIdx: index("events_restaurant_idx").on(t.restaurantId, t.ts),
    dishIdx: index("events_dish_idx").on(t.dishId, t.ts),
  }),
);

// Code-side allowlist for type safety — add new events here.
export const EVENT_TYPES = [
  "page_view",
  "restaurant_view",
  "dish_select",
  "wine_select",
  "pairing_request",
  "pairing_match",
  "profile_save",
  "chat_message_user",
  "chat_message_assistant",
  "compass_intensity_set",
  "admin_dish_create",
  "admin_dish_update",
  "admin_dish_delete",
  "admin_wine_create",
  "admin_wine_update",
  "admin_wine_delete",
  "admin_pairing_create",
  "admin_pairing_update",
  "admin_pairing_delete",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// ─────────────────────────  CHAT  ─────────────────────────
// Stored for analytics & debugging. Per-session anon, redaction on user request.

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousId: uuid("anonymous_id").notNull(),
    profileId: uuid("profile_id").references(() => tasteProfiles.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => ({
    anonIdx: index("chat_sessions_anon_idx").on(t.anonymousId),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    tokens: integer("tokens"),
    model: text("model"),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("chat_messages_session_idx").on(t.sessionId, t.ts),
  }),
);

// ─────────────────────────  RELATIONS  ─────────────────────────
// Keep relations declarations co-located so query-builder gets typed joins.

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  dishes: many(dishes),
  wines: many(wines),
  pairings: many(curatedPairings),
  members: many(restaurantMembers),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [dishes.restaurantId],
    references: [restaurants.id],
  }),
  pairings: many(curatedPairings),
}));

export const winesRelations = relations(wines, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [wines.restaurantId],
    references: [restaurants.id],
  }),
  pairings: many(curatedPairings),
}));

export const curatedPairingsRelations = relations(curatedPairings, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [curatedPairings.restaurantId],
    references: [restaurants.id],
  }),
  dish: one(dishes, {
    fields: [curatedPairings.dishId],
    references: [dishes.id],
  }),
  wine: one(wines, {
    fields: [curatedPairings.wineId],
    references: [wines.id],
  }),
}));

export const restaurantMembersRelations = relations(restaurantMembers, ({ one }) => ({
  user: one(users, {
    fields: [restaurantMembers.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [restaurantMembers.restaurantId],
    references: [restaurants.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  members: many(restaurantMembers),
  profiles: many(tasteProfiles),
}));

export const tasteProfilesRelations = relations(tasteProfiles, ({ one }) => ({
  user: one(users, { fields: [tasteProfiles.userId], references: [users.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ many, one }) => ({
  messages: many(chatMessages),
  profile: one(tasteProfiles, {
    fields: [chatSessions.profileId],
    references: [tasteProfiles.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));
