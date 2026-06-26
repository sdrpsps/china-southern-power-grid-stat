import type { JWTPayload } from "jose"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { mcpTokens } from "@/lib/db/schema"

export const MCP_TOKEN_USE = "mcp"
export const MCP_TOKEN_SCOPE = "mcp:access"
export const MCP_TOKEN_LIFETIME_ENV = "MCP_TOKEN_EXPIRES_IN_DAYS"
export const DEFAULT_MCP_TOKEN_LIFETIME_DAYS = 365
export const MIN_MCP_TOKEN_LIFETIME_DAYS = 300

const SECONDS_PER_DAY = 24 * 60 * 60

export type McpTokenPayload = JWTPayload & {
  sub: string
  jti: string
  token_use: typeof MCP_TOKEN_USE
  scope: typeof MCP_TOKEN_SCOPE
  iat: number
  exp: number
}

export type IssuedMcpAccessToken = {
  token: string
  expiresAt: string
  lifetimeDays: number
  lifetimeSeconds: number
}

export function getMcpTokenLifetimeDays() {
  const configured = process.env[MCP_TOKEN_LIFETIME_ENV]
  if (!configured) return DEFAULT_MCP_TOKEN_LIFETIME_DAYS

  const days = Number(configured)
  if (!Number.isInteger(days) || days < MIN_MCP_TOKEN_LIFETIME_DAYS) {
    return DEFAULT_MCP_TOKEN_LIFETIME_DAYS
  }

  return days
}

export function getMcpTokenLifetimeSeconds() {
  return getMcpTokenLifetimeDays() * SECONDS_PER_DAY
}

export function getMcpTokenExpirationDate(now = new Date()) {
  return new Date(now.getTime() + getMcpTokenLifetimeSeconds() * 1000)
}

export async function issueMcpAccessToken(
  userId: string,
  nameOrNow?: string | Date,
  nowArg?: Date
): Promise<IssuedMcpAccessToken> {
  const name = typeof nameOrNow === "string" ? nameOrNow : "Default Agent"
  const now = nameOrNow instanceof Date ? nameOrNow : (nowArg || new Date())

  const iat = Math.floor(now.getTime() / 1000)
  const lifetimeSeconds = getMcpTokenLifetimeSeconds()
  const exp = iat + lifetimeSeconds
  const jti = randomUUID()
  const { token } = await auth.api.signJWT({
    body: {
      payload: {
        sub: userId,
        jti,
        iat,
        exp,
        token_use: MCP_TOKEN_USE,
        scope: MCP_TOKEN_SCOPE,
      },
    },
  })

  const db = getDb()
  db.insert(mcpTokens)
    .values({
      tokenKey: jti,
      name,
      userId,
      expiresAt: new Date(exp * 1000).toISOString(),
      createdAt: now.toISOString(),
    })
    .run()

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
    lifetimeDays: getMcpTokenLifetimeDays(),
    lifetimeSeconds,
  }
}

export async function verifyMcpAccessToken(token: string): Promise<McpTokenPayload | null> {
  const result = await auth.api.verifyJWT({
    body: { token },
  })
  const payload = result.payload

  if (!payload) return null
  if (typeof payload.sub !== "string" || !payload.sub) return null
  if (typeof payload.jti !== "string" || !payload.jti) return null
  if (payload.token_use !== MCP_TOKEN_USE) return null
  if (payload.scope !== MCP_TOKEN_SCOPE) return null
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number") return null

  const db = getDb()
  const tokenRecord = db
    .select()
    .from(mcpTokens)
    .where(eq(mcpTokens.tokenKey, payload.jti))
    .get()

  if (!tokenRecord) return null

  return payload as McpTokenPayload
}

export function getBearerToken(authorization: string | null) {
  if (!authorization) return null
  const [scheme, token, ...rest] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null
  }
  return token
}
