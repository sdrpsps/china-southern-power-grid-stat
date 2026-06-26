import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"

import { getDb } from "@/lib/db/client"
import {
  getProfileByAlias,
  listPublicProfiles,
  saveSession,
  upsertProfile,
} from "@/lib/services/repositories"

function useTempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csg-db-"))
  process.env.CSG_DATABASE_PATH = path.join(dir, "test.sqlite")
  getDb()
}

describe("repositories", () => {
  beforeEach(() => {
    useTempDb()
  })

  it("creates profiles, stores sessions, and omits raw tokens from public rows", async () => {
    const profile = await upsertProfile({ alias: "default", label: "家里", setDefault: true })
    await saveSession({ profileId: profile.id, authToken: "secret-token", valid: true })

    const rows = await listPublicProfiles()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      alias: "default",
      label: "家里",
      isDefault: true,
      hasSession: true,
      sessionValid: true,
    })
    expect(JSON.stringify(rows)).not.toContain("secret-token")
  })

})
