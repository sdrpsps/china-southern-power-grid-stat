import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { GET as accountsRoute } from "@/app/api/accounts/route"
import { POST as balancesRoute } from "@/app/api/balances/route"
import { POST as usageRoute } from "@/app/api/usage/route"
import { GET as profilesRoute } from "@/app/api/profiles/route"
import { GET as verifyRoute } from "@/app/api/session/verify/route"
import { POST as qrRoute } from "@/app/api/session/qr/route"
import { POST as completeSmsRoute } from "@/app/api/session/sms/complete/route"
import { POST as sendSmsRoute } from "@/app/api/session/sms/send/route"

function useTempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csg-route-"))
  process.env.CSG_DATABASE_PATH = path.join(dir, "test.sqlite")
  process.env.CSG_MOCK = "1"
}

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("route handlers", () => {
  beforeEach(() => {
    useTempDb()
  })

  async function loginDefaultProfile() {
    const response = await completeSmsRoute(
      jsonRequest("http://localhost/api/session/sms/complete", {
        alias: "default",
        phoneNo: "13800138000",
        smsCode: "123456",
        setDefault: true,
      })
    )
    expect(response.status).toBe(200)
  }

  it("logs in and exposes safe profiles", async () => {
    await loginDefaultProfile()

    const response = await profilesRoute()
    const payload = await response.json()
    expect(payload.profiles[0].alias).toBe("default")
    expect(JSON.stringify(payload)).not.toContain("123456")
    expect(JSON.stringify(payload)).not.toContain("mock-sms-token")
  })

  it("creates profiles through web login routes without exposing credentials", async () => {
    const sent = await sendSmsRoute(
      jsonRequest("http://localhost/api/session/sms/send", {
        phoneNo: "13800138000",
      })
    )
    expect(sent.status).toBe(200)

    const smsLogin = await completeSmsRoute(
      jsonRequest("http://localhost/api/session/sms/complete", {
        alias: "sms",
        label: "短信登录",
        phoneNo: "13800138000",
        smsCode: "123456",
        password: "secret",
        setDefault: true,
      })
    )
    expect(smsLogin.status).toBe(200)

    let appQrPayload: { loginId: string; qrUrl: string } | null = null
    for (const channel of ["wechat", "alipay", "app"]) {
      const qrCreated = await qrRoute(
        jsonRequest("http://localhost/api/session/qr", {
          action: "create",
          channel,
        })
      )
      const qrPayload = await qrCreated.json()
      expect(qrPayload.loginId).toBeTruthy()
      expect(qrPayload.qrUrl).toContain("data:image")
      if (channel === "app") appQrPayload = qrPayload
    }

    const invalidQr = await qrRoute(
      jsonRequest("http://localhost/api/session/qr", {
        action: "create",
        channel: "unknown",
      })
    )
    expect(invalidQr.status).toBe(400)

    const qrLogin = await qrRoute(
      jsonRequest("http://localhost/api/session/qr", {
        action: "complete",
        loginId: appQrPayload?.loginId,
        alias: "qr",
        label: "扫码登录",
      })
    )
    expect(qrLogin.status).toBe(200)

    const response = await profilesRoute()
    const payload = await response.json()
    expect(payload.profiles.map((profile: { alias: string }) => profile.alias)).toEqual(["sms", "qr"])
    expect(JSON.stringify(payload)).not.toContain("secret")
    expect(JSON.stringify(payload)).not.toContain("123456")
    expect(JSON.stringify(payload)).not.toContain("mock-password-sms-token")
    expect(JSON.stringify(payload)).not.toContain("mock-qr-token")
  })

  it("serves accounts, balances, usage, and verification", async () => {
    await loginDefaultProfile()

    const accountsResponse = await accountsRoute(new NextRequest("http://localhost/api/accounts?refresh=1"))
    expect((await accountsResponse.json()).accounts).toHaveLength(1)

    const balancesResponse = await balancesRoute(
      jsonRequest("http://localhost/api/balances", {
        accountNumbers: ["030000000000001"],
      })
    )
    expect((await balancesResponse.json()).balances[0].balance).toBeGreaterThan(0)

    const usageResponse = await usageRoute(
      jsonRequest("http://localhost/api/usage", {
        accountNumbers: ["030000000000001"],
        year: 2026,
        month: 6,
      })
    )
    expect((await usageResponse.json()).usages[0].dailyDetails.length).toBeGreaterThan(0)

    const verifyResponse = await verifyRoute(new NextRequest("http://localhost/api/session/verify"))
    expect((await verifyResponse.json()).profiles[0].valid).toBe(true)
  })
})
