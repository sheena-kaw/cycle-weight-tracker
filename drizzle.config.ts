import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  // Scoped to "public" so future generate/migrate runs only ever diff and
  // apply our own tables, never Neon-owned neon_auth tables (those were
  // introspected once into app/db/schema.ts via `npm run db:pull` and are
  // referenced there only for the FK target, not managed by us).
  schemaFilter: ["public"],
});
