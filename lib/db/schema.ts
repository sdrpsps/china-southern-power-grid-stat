import { relations } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const profiles = sqliteTable(
  "profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    alias: text("alias").notNull(),
    label: text("label"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("profiles_alias_unique").on(table.alias)]
)

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    authToken: text("auth_token").notNull(),
    valid: integer("valid", { mode: "boolean" }),
    lastVerifiedAt: text("last_verified_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("sessions_profile_unique").on(table.profileId)]
)


export const operationLogs = sqliteTable(
  "operation_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    operation: text("operation").notNull(),
    profileAlias: text("profile_alias"),
    accountNumber: text("account_number"),
    status: text("status", { enum: ["success", "failure"] }).notNull(),
    summary: text("summary"),
    error: text("error"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("operation_logs_created_idx").on(table.createdAt)]
)

export const profilesRelations = relations(profiles, ({ one }) => ({
  session: one(sessions, {
    fields: [profiles.id],
    references: [sessions.profileId],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  profile: one(profiles, {
    fields: [sessions.profileId],
    references: [profiles.id],
  }),
}))

export type ProfileRow = typeof profiles.$inferSelect
export type NewProfileRow = typeof profiles.$inferInsert
export type SessionRow = typeof sessions.$inferSelect

// Better Auth Schema tables for user accounts and sessions
export const authUsers = sqliteTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
})

export const authSessions = sqliteTable("auth_session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
})

export const authAccounts = sqliteTable("auth_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const authVerifications = sqliteTable("auth_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
})

export type AuthUserRow = typeof authUsers.$inferSelect
export type AuthSessionRow = typeof authSessions.$inferSelect
export type AuthAccountRow = typeof authAccounts.$inferSelect
export type AuthVerificationRow = typeof authVerifications.$inferSelect

export const authJwks = sqliteTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
})

export type AuthJwksRow = typeof authJwks.$inferSelect

export const mcpTokens = sqliteTable(
  "mcp_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tokenKey: text("token_key").notNull(),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("mcp_tokens_key_unique").on(table.tokenKey),
  ]
)

export type McpTokenRow = typeof mcpTokens.$inferSelect

export const mcpTokensRelations = relations(mcpTokens, ({ one }) => ({
  user: one(authUsers, {
    fields: [mcpTokens.userId],
    references: [authUsers.id],
  }),
}))

export const authUsersRelations = relations(authUsers, ({ many }) => ({
  mcpTokens: many(mcpTokens),
}))



