import { defineConfig } from "drizzle-kit"

const databasePath =
  process.env.CSG_DATABASE_PATH ||
  (process.env.CSG_DATA_DIR
    ? `${process.env.CSG_DATA_DIR.replace(/\/$/, "")}/csg-stat.sqlite`
    : "./data/csg-stat.sqlite")

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: databasePath,
  },
})
