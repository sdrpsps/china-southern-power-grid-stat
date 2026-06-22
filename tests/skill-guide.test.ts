import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

function readProjectFile(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8")
}

describe("Skill guide", () => {
  it("lists the MCP tools registered by the server", () => {
    const serverSource = readProjectFile("lib/mcp/server.ts")
    const skillGuide = readProjectFile("skills/china-southern-power-grid-stat/SKILL.md")
    const toolNames = Array.from(serverSource.matchAll(/registerTool\(\s*\n\s*"([^"]+)"/g)).map(
      (match) => match[1]
    )

    expect(toolNames).toEqual([
      "list_profiles",
      "get_electricity_accounts",
      "get_balance",
      "get_usage",
      "verify_session",
    ])
    for (const toolName of toolNames) {
      expect(skillGuide).toContain(`\`${toolName}\``)
    }
  })
})
