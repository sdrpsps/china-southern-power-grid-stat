import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"

import { getDb } from "@/lib/db/client"
import {
  getProfileByAlias,
  listPublicProfiles,
  saveSession,
  upsertAccountSnapshot,
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

  it("upserts account snapshots", async () => {
    const profile = await upsertProfile({ alias: "default" })
    await upsertAccountSnapshot(profile.id, {
      profile: "default",
      accountNumber: "030000000000001",
      areaCode: "030000",
      eleCustomerId: "customer",
      meteringPointId: "point",
      meteringPointNumber: "mp",
      address: "广东省广州市示例路1号",
      userName: "测试用户",
    })

    expect(await getProfileByAlias("default")).not.toBeNull()
  })
})
