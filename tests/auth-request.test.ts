import { afterEach, describe, expect, it, vi } from "vitest"

const originalAppBasePath = process.env.APP_BASE_PATH

async function loadAuthRequest(appBasePath: string | undefined) {
  vi.resetModules()
  if (appBasePath === undefined) {
    delete process.env.APP_BASE_PATH
  } else {
    process.env.APP_BASE_PATH = appBasePath
  }
  return import("@/lib/auth-request")
}

afterEach(() => {
  vi.resetModules()
  if (originalAppBasePath === undefined) {
    delete process.env.APP_BASE_PATH
  } else {
    process.env.APP_BASE_PATH = originalAppBasePath
  }
})

describe("auth route request base path normalization", () => {
  it("leaves root deployments unchanged", async () => {
    const { normalizeAuthRequestBasePath } = await loadAuthRequest(undefined)
    const request = new Request("http://localhost:3000/api/auth/ok")

    expect(normalizeAuthRequestBasePath(request)).toBe(request)
  })

  it("adds the app base path when Next strips it before invoking the route handler", async () => {
    const { normalizeAuthRequestBasePath } = await loadAuthRequest("/csg")
    const request = new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com" }),
    })

    const normalized = normalizeAuthRequestBasePath(request)

    expect(new URL(normalized.url).pathname).toBe("/csg/api/auth/sign-in/email")
    expect(normalized.method).toBe("POST")
  })

  it("does not duplicate the app base path when it is already present", async () => {
    const { normalizeAuthRequestBasePath } = await loadAuthRequest("/csg")
    const request = new Request("http://localhost:3000/csg/api/auth/ok")

    expect(normalizeAuthRequestBasePath(request)).toBe(request)
  })

  it("does not rewrite unrelated API paths", async () => {
    const { normalizeAuthRequestBasePath } = await loadAuthRequest("/csg")
    const request = new Request("http://localhost:3000/api/profiles")

    expect(normalizeAuthRequestBasePath(request)).toBe(request)
  })
})
