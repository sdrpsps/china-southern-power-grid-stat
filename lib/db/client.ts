import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { getDatabasePath } from "@/lib/db/config"
import { runMigrations } from "@/lib/db/migrate"
import * as schema from "@/lib/db/schema"

type DbBundle = {
  sqlite: Database.Database
  db: ReturnType<typeof drizzle<typeof schema>>
  path: string
}

const globalForDb = globalThis as typeof globalThis & {
  __csgDbBundle?: DbBundle
}

export function createDbBundle(databasePath = getDatabasePath()): DbBundle {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })
  const sqlite = new Database(databasePath)
  runMigrations(sqlite)
  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    path: databasePath,
  }
}

export function getDbBundle() {
  const desiredPath = getDatabasePath()
  if (!globalForDb.__csgDbBundle || globalForDb.__csgDbBundle.path !== desiredPath) {
    globalForDb.__csgDbBundle = createDbBundle(desiredPath)
  }
  return globalForDb.__csgDbBundle
}

export function getDb() {
  return getDbBundle().db
}
