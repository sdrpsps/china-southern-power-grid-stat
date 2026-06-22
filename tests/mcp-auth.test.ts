import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const transportMocks = vi.hoisted(() => ({
  handleRequest: vi.fn(async () => Response.json({ ok: true })),
  connect: vi.fn(async () => undefined),
  close: vi.fn(async () => undefined),
}))

vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => ({
  WebStandardStreamableHTTPServerTransport: vi.fn().mockImplementation(function () {
    return {
      handleRequest: transportMocks.handleRequest,
    }
  }),
}))

vi.mock("@/lib/mcp/server", () => ({
  createMcpServer: vi.fn(() => ({
    connect: transportMocks.connect,
    close: transportMocks.close,
  })),
}))

function useTempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csg-mcp-auth-"))
  process.env.CSG_DATABASE_PATH = path.join(dir, "test.sqlite")
  process.env.CSG_MOCK = "1"
  process.env.BETTER_AUTH_URL = "http://localhost"
  process.env.BETTER_AUTH_SECRET = "test-secret-for-mcp-auth-0123456789"
  delete process.env.MCP_TOKEN_EXPIRES_IN_DAYS
}

function decodePayload(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))
}

async function signJwt(payload: Record<string, unknown>) {
  const { auth } = await import("@/lib/auth")
  const { token } = await auth.api.signJWT({
    body: { payload },
  })
  return token
}

async function issueToken(userId = "admin-user") {
  const { issueMcpAccessToken } = await import("@/lib/mcp/auth")
  return issueMcpAccessToken(userId, new Date("2026-06-23T00:00:00.000Z"))
}

function mcpRequest(token?: string, authorization?: string) {
  return new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: authorization || token ? { Authorization: authorization || `Bearer ${token}` } : {},
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    }),
  })
}

describe("MCP access token helpers", () => {
  beforeEach(() => {
    vi.resetModules()
    useTempDb()
  })

  it("issues long-lived MCP-scoped tokens", async () => {
    const { DEFAULT_MCP_TOKEN_LIFETIME_DAYS, MCP_TOKEN_SCOPE, MCP_TOKEN_USE, verifyMcpAccessToken } =
      await import("@/lib/mcp/auth")
    const issued = await issueToken("admin-user")
    const payload = decodePayload(issued.token)

    expect(issued.lifetimeDays).toBe(DEFAULT_MCP_TOKEN_LIFETIME_DAYS)
    expect(issued.lifetimeDays).toBeGreaterThanOrEqual(300)
    expect(issued.lifetimeSeconds).toBe(DEFAULT_MCP_TOKEN_LIFETIME_DAYS * 24 * 60 * 60)
    expect(payload.sub).toBe("admin-user")
    expect(payload.token_use).toBe(MCP_TOKEN_USE)
    expect(payload.scope).toBe(MCP_TOKEN_SCOPE)
    expect(payload.exp - payload.iat).toBe(issued.lifetimeSeconds)
    expect(await verifyMcpAccessToken(issued.token)).toMatchObject({
      sub: "admin-user",
      token_use: MCP_TOKEN_USE,
      scope: MCP_TOKEN_SCOPE,
    })
  })

  it("falls back to the default lifetime for invalid environment configuration", async () => {
    process.env.MCP_TOKEN_EXPIRES_IN_DAYS = "20"
    const { DEFAULT_MCP_TOKEN_LIFETIME_DAYS, getMcpTokenLifetimeDays } =
      await import("@/lib/mcp/auth")

    expect(getMcpTokenLifetimeDays()).toBe(DEFAULT_MCP_TOKEN_LIFETIME_DAYS)
  })

  it("rejects expired and wrong-purpose JWTs", async () => {
    const { MCP_TOKEN_SCOPE, MCP_TOKEN_USE, verifyMcpAccessToken } = await import("@/lib/mcp/auth")
    const now = Math.floor(Date.now() / 1000)
    const expiredToken = await signJwt({
      sub: "admin-user",
      iat: now - 120,
      exp: now - 60,
      token_use: MCP_TOKEN_USE,
      scope: MCP_TOKEN_SCOPE,
    })
    const wrongPurposeToken = await signJwt({
      sub: "admin-user",
      iat: now,
      exp: now + 60,
    })

    expect(await verifyMcpAccessToken(expiredToken)).toBeNull()
    expect(await verifyMcpAccessToken(wrongPurposeToken)).toBeNull()
  })
})

describe("MCP route Bearer authentication", () => {
  beforeEach(() => {
    vi.resetModules()
    transportMocks.handleRequest.mockClear()
    transportMocks.connect.mockClear()
    transportMocks.close.mockClear()
    useTempDb()
  })

  it("rejects missing and malformed Authorization headers without invoking the transport", async () => {
    const { POST } = await import("@/app/api/mcp/route")

    const missing = await POST(mcpRequest())
    const malformed = await POST(mcpRequest(undefined, "Token abc"))

    expect(missing.status).toBe(401)
    expect(await missing.json()).toMatchObject({ error: expect.stringContaining("MCP Bearer token") })
    expect(malformed.status).toBe(401)
    expect(transportMocks.connect).not.toHaveBeenCalled()
    expect(transportMocks.handleRequest).not.toHaveBeenCalled()
  })

  it("rejects expired and wrong-purpose Bearer tokens without invoking the transport", async () => {
    const { MCP_TOKEN_SCOPE, MCP_TOKEN_USE } = await import("@/lib/mcp/auth")
    const { POST } = await import("@/app/api/mcp/route")
    const now = Math.floor(Date.now() / 1000)
    const expiredToken = await signJwt({
      sub: "admin-user",
      iat: now - 120,
      exp: now - 60,
      token_use: MCP_TOKEN_USE,
      scope: MCP_TOKEN_SCOPE,
    })
    const wrongPurposeToken = await signJwt({
      sub: "admin-user",
      iat: now,
      exp: now + 60,
    })

    const expired = await POST(mcpRequest(expiredToken))
    const wrongPurpose = await POST(mcpRequest(wrongPurposeToken))

    expect(expired.status).toBe(401)
    expect(wrongPurpose.status).toBe(401)
    expect(transportMocks.connect).not.toHaveBeenCalled()
    expect(transportMocks.handleRequest).not.toHaveBeenCalled()
  })

  it("allows valid MCP Bearer tokens to reach the transport", async () => {
    const { POST } = await import("@/app/api/mcp/route")
    const issued = await issueToken()

    const response = await POST(mcpRequest(issued.token))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(transportMocks.connect).toHaveBeenCalledTimes(1)
    expect(transportMocks.handleRequest).toHaveBeenCalledTimes(1)
    expect(transportMocks.close).toHaveBeenCalledTimes(1)
  })
})
