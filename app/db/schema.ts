import {
	pgTable, pgSchema, index, foreignKey, uuid, text, timestamp, unique,
	boolean, uniqueIndex, jsonb, real, integer, check,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ---- Introspected via `npm run db:pull` — do not hand-edit this section. ----
// Re-running db:pull overwrites drizzle/schema.ts (its output dir), not this
// file, but if you ever copy a fresh pull over this file, re-add the
// hand-written tables below it afterward.

export const neonAuth = pgSchema("neon_auth");

export const invitationInNeonAuth = neonAuth.table("invitation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid().notNull(),
	email: text().notNull(),
	role: text(),
	status: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	inviterId: uuid().notNull(),
}, (table) => [
	index("invitation_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitation_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationInNeonAuth.id],
			name: "invitation_organizationId_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [userInNeonAuth.id],
			name: "invitation_inviterId_fkey"
		}).onDelete("cascade"),
]);

export const userInNeonAuth = neonAuth.table("user", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	role: text(),
	banned: boolean(),
	banReason: text(),
	banExpires: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const sessionInNeonAuth = neonAuth.table("session", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: uuid().notNull(),
	impersonatedBy: text(),
	activeOrganizationId: text(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userInNeonAuth.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const organizationInNeonAuth = neonAuth.table("organization", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	metadata: text(),
}, (table) => [
	uniqueIndex("organization_slug_uidx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("organization_slug_key").on(table.slug),
]);

export const accountInNeonAuth = neonAuth.table("account", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: uuid().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userInNeonAuth.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const verificationInNeonAuth = neonAuth.table("verification", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const jwksInNeonAuth = neonAuth.table("jwks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	publicKey: text().notNull(),
	privateKey: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }),
});

export const memberInNeonAuth = neonAuth.table("member", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid().notNull(),
	userId: uuid().notNull(),
	role: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("member_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("member_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizationInNeonAuth.id],
			name: "member_organizationId_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userInNeonAuth.id],
			name: "member_userId_fkey"
		}).onDelete("cascade"),
]);

export const projectConfigInNeonAuth = neonAuth.table("project_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	endpointId: text("endpoint_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	trustedOrigins: jsonb("trusted_origins").notNull(),
	socialProviders: jsonb("social_providers").notNull(),
	emailProvider: jsonb("email_provider"),
	emailAndPassword: jsonb("email_and_password"),
	allowLocalhost: boolean("allow_localhost").notNull(),
	pluginConfigs: jsonb("plugin_configs"),
	webhookConfig: jsonb("webhook_config"),
}, (table) => [
	unique("project_config_endpoint_id_key").on(table.endpointId),
]);

// ---- Hand-written app tables ----
// user_id is a hard reference into neon_auth.user, cascading on account
// deletion. Uniqueness is per-user (not global) now: two different accounts
// logging the same calendar date is normal, unlike the old single-user
// SQLite schema where `date`/`start_date` were globally unique.

export const weightEntries = pgTable("weight_entries", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id").notNull().references(() => userInNeonAuth.id, { onDelete: "cascade" }),
	date: text("date").notNull(),
	weight: real("weight").notNull(),
}, (table) => [
	unique("weight_entries_user_id_date_unique").on(table.userId, table.date),
	check("weight_entries_weight_positive", sql`${table.weight} > 0`),
]);

export const periods = pgTable("periods", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id").notNull().references(() => userInNeonAuth.id, { onDelete: "cascade" }),
	startDate: text("start_date").notNull(),
	endDate: text("end_date"),
}, (table) => [
	unique("periods_user_id_start_date_unique").on(table.userId, table.startDate),
	check("periods_end_after_start", sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
]);
