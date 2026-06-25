import { afterEach, describe, expect, it, vi } from "vitest"

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL

async function loadAuthUrl(value: string | undefined) {
  vi.resetModules()
  if (value === undefined) {
    delete process.env.BETTER_AUTH_URL
  } else {
    process.env.BETTER_AUTH_URL = value
  }
  return import("@/lib/auth-url")
}

afterEach(() => {
  vi.resetModules()
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl
  }
})

describe("Better Auth URL helper", () => {
  it("leaves Better Auth URL undefined when not configured", async () => {
    const { getBetterAuthBaseUrl } = await loadAuthUrl(undefined)

    expect(getBetterAuthBaseUrl()).toBeUndefined()
  })

  it("appends the auth route to a root deployment URL", async () => {
    const { getBetterAuthBaseUrl } = await loadAuthUrl("https://mcp.example.com")

    expect(getBetterAuthBaseUrl()).toBe("https://mcp.example.com/api/auth")
  })

  it("appends the auth route to a path-mounted app URL", async () => {
    const { getBetterAuthBaseUrl } = await loadAuthUrl("https://mcp.example.com/electricity/")

    expect(getBetterAuthBaseUrl()).toBe("https://mcp.example.com/electricity/api/auth")
  })

  it("does not duplicate the auth route when a full auth URL is provided", async () => {
    const { getBetterAuthBaseUrl } = await loadAuthUrl("https://mcp.example.com/electricity/api/auth/")

    expect(getBetterAuthBaseUrl()).toBe("https://mcp.example.com/electricity/api/auth")
  })
})
