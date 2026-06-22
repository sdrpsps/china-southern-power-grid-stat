## 1. Skill Guide Conversion

- [x] 1.1 Rewrite `skills/china-southern-power-grid-stat/SKILL.md` as an MCP-first guide that depends on a preconfigured `china-southern-power-grid` MCP service.
- [x] 1.2 List the expected MCP tools in the Skill guide: `list_profiles`, `get_electricity_accounts`, `get_balance`, `get_usage`, and `verify_session`.
- [x] 1.3 Replace shell command examples with MCP tool usage guidance for profiles, accounts, balances, usage, and session verification.
- [x] 1.4 Add missing-MCP behavior telling the assistant to ask the user to configure the MCP service instead of guessing paths, URLs, or session files.
- [x] 1.5 Preserve privacy guidance for complete account numbers, addresses, usernames, and session contents.
- [x] 1.6 Specify that monthly usage and monthly electricity cost details must be rendered as Markdown tables with date, usage, and fee/cost columns.

## 2. Remove Skill Runtime Script Surface

- [x] 2.1 Remove `skills/china-southern-power-grid-stat/scripts/cli.cjs` from the distributable Skill package.
- [x] 2.2 Remove `build:skill` behavior so normal builds no longer regenerate `scripts/cli.cjs` or process static Skill docs.
- [x] 2.3 Remove or replace `pack:skill-local` behavior so local credentials are no longer copied into the Skill package.
- [x] 2.4 Clean up empty Skill script directories if they are no longer needed.

## 3. Documentation Updates

- [x] 3.1 Update `README.md` to describe Skill mode as guide-only and MCP-first.
- [x] 3.2 Remove README instructions that tell users to deploy `.csg/` beside Skill scripts or run `node ./scripts/cli.cjs`.
- [x] 3.3 Keep README instructions for configuring and running the MCP server as the data-access path.
- [x] 3.4 Document the expected MCP service name and tools for Skill users.
- [x] 3.5 Mark the removal of the Skill CLI/script path as a breaking change or migration note.

## 4. Verification

- [x] 4.1 Run typecheck and existing tests to confirm MCP/server code still passes.
- [x] 4.2 Verify the Skill package directory contains `SKILL.md` and does not contain `scripts/cli.cjs`, `session.json`, or `scripts/.csg/`.
- [x] 4.3 Verify `SKILL.md` contains no fixed MCP URL, stdio command, absolute local path, or credential location.
- [x] 4.4 Verify the Skill guide includes the Markdown table requirement for monthly usage and monthly electricity cost answers.
- [x] 4.5 Run OpenSpec validation/status for `convert-skill-to-mcp-guide`.
