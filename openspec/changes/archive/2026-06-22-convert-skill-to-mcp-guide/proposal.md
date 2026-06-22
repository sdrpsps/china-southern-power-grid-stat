## Why

The current Skill package carries a local execution script and describes script-based commands, which makes the Skill responsible for both guidance and data access. Users ultimately must configure the MCP service in their agent anyway, so the Skill should become a portable guide that explains how and when to use the already-configured MCP tools.

## What Changes

- **BREAKING**: Remove the bundled Skill execution script from the Skill package contract.
- **BREAKING**: Stop documenting `node ./scripts/cli.cjs` as the Skill invocation path.
- Convert `SKILL.md` into an MCP-first assistant guide that depends on a preconfigured `china-southern-power-grid` MCP service.
- Document the expected MCP service name and tool set so agents can detect missing configuration and tell users what to fix.
- Preserve privacy, account-selection, profile-selection, and daily usage answer rules in the MCP-first Skill guide.
- Require monthly electricity cost and usage answers to render month/day details as Markdown tables.
- Keep MCP service implementation, build output, credentials, and login flows outside the Skill package.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `skill-package`: Change the Skill package from a script-executing portable CLI wrapper into an MCP guide-only package with no bundled execution script, and require monthly electricity cost details to be answered as Markdown tables.

## Impact

- Affected artifacts: `skills/china-southern-power-grid-stat/SKILL.md`, `skills/china-southern-power-grid-stat/scripts/cli.cjs`, and Skill build/packaging behavior.
- Affected docs: `README.md` sections describing Skill mode, Skill package layout, and Skill deployment.
- Affected specs: `openspec/specs/skill-package/spec.md`.
- MCP server tools and credential/login behavior remain the source of data access and should not change as part of this proposal.
