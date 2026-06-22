import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"

import { mcpHandlers } from "@/lib/mcp/server"
import { completeSmsLogin } from "@/lib/services/profiles"

type ProfilesContent = { profiles: unknown }
type AccountsContent = { accounts: unknown }
type BalancesContent = { balances: unknown }
type UsageContent = { usages: unknown }
type ErrorContent = { error: string }

function useTempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csg-mcp-"))
  process.env.CSG_DATABASE_PATH = path.join(dir, "test.sqlite")
  process.env.CSG_MOCK = "1"
}

describe("MCP handlers", () => {
  beforeEach(async () => {
    useTempDb()
    await completeSmsLogin({
      alias: "default",
      phoneNo: "13800138000",
      smsCode: "123456",
      setDefault: true,
    })
  })

  it("exposes profile, account, balance, usage, and verification results", async () => {
    const profiles = await mcpHandlers.listProfiles()
    expect((profiles.structuredContent as ProfilesContent).profiles).toMatchObject([
      { alias: "default", hasSession: true },
    ])

    const accounts = await mcpHandlers.listAccounts({})
    expect((accounts.structuredContent as AccountsContent).accounts).toMatchObject([
      { profile: "default", accountNumber: "030000000000001" },
    ])

    const balances = await mcpHandlers.getBalance({
      accountNumber: "030000000000001",
    })
    expect((balances.structuredContent as BalancesContent).balances).toMatchObject([
      { profile: "default", balance: expect.any(Number), arrears: expect.any(Number) },
    ])
    expect("isError" in balances ? balances.isError : undefined).toBeUndefined()

    const usage = await mcpHandlers.getUsage({
      accountNumber: "030000000000001",
      year: 2026,
      month: 6,
    })
    expect((usage.structuredContent as UsageContent).usages).toMatchObject([
      { profile: "default", monthTotalKwh: expect.any(Number) },
    ])

    const verification = await mcpHandlers.verifySession({})
    expect((verification.structuredContent as ProfilesContent).profiles).toMatchObject([
      { profile: "default", valid: true },
    ])
    expect("isError" in verification ? verification.isError : undefined).toBe(false)
  })

  it("returns MCP tool errors instead of throwing domain validation failures", async () => {
    const result = await mcpHandlers.getBalance({ accountNumber: "not-a-number" })

    expect("isError" in result ? result.isError : undefined).toBe(true)
    expect((result.structuredContent as ErrorContent).error).toContain("缴费户号")
  })
})
