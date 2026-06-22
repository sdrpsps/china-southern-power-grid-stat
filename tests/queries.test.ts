import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"

import { completeSmsLogin } from "@/lib/services/profiles"
import { listAccounts, queryBalances, queryUsage } from "@/lib/services/queries"

function useTempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csg-query-"))
  process.env.CSG_DATABASE_PATH = path.join(dir, "test.sqlite")
  process.env.CSG_MOCK = "1"
}

describe("query orchestration", () => {
  beforeEach(async () => {
    useTempDb()
    await completeSmsLogin({
      alias: "default",
      phoneNo: "13800138000",
      smsCode: "123456",
      setDefault: true,
    })
  })

  it("discovers accounts and queries balances in mock mode", async () => {
    const accounts = await listAccounts()
    expect(accounts.accounts[0].accountNumber).toBe("030000000000001")

    const balances = await queryBalances({
      accountNumbers: ["030000000000001"],
    })
    expect(balances.balances[0].balance).toBeGreaterThan(0)
    expect(balances.errors).toHaveLength(0)
  })

  it("queries usage details in mock mode", async () => {
    const usage = await queryUsage({
      accountNumbers: ["030000000000001"],
      year: 2026,
      month: 6,
    })
    expect(usage.usages[0].dailyDetails.length).toBeGreaterThan(0)
    expect(usage.usages[0].monthTotalKwh).toBeGreaterThan(0)
  })
})
