import { describe, expect, it } from "vitest"

import { normalizeBasePath, stripBasePath, withBasePath } from "@/lib/app-path"

describe("app path helpers", () => {
  it("normalizes configured base paths", () => {
    expect(normalizeBasePath("")).toBe("")
    expect(normalizeBasePath("/")).toBe("")
    expect(normalizeBasePath("electricity/")).toBe("/electricity")
    expect(normalizeBasePath("/electricity/")).toBe("/electricity")
  })

  it("keeps root deployments unchanged", () => {
    expect(withBasePath("/api/mcp", "")).toBe("/api/mcp")
    expect(stripBasePath("/api/mcp", "")).toBe("/api/mcp")
  })

  it("prefixes and strips path-mounted deployments", () => {
    expect(withBasePath("/", "/electricity")).toBe("/electricity/")
    expect(withBasePath("/api/mcp", "electricity/")).toBe("/electricity/api/mcp")
    expect(stripBasePath("/electricity", "/electricity")).toBe("/")
    expect(stripBasePath("/electricity/api/mcp", "/electricity")).toBe("/api/mcp")
  })
})
