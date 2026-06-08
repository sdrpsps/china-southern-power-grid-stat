## Why

An exported skill run for a monthly electricity query hit avoidable errors before returning a result: the CLI rejected the discovered `accountNumber` because it assumed all payment account numbers are 16 digits, then a retry used `meteringPointNumber` even though selection only matches bound payment accounts. The final answer also compressed daily usage into arrow-separated text, making daily electricity amount and kWh patterns harder to inspect.

## What Changes

- Accept real South China Grid payment account numbers returned by account discovery, including the 15-digit account observed in the failed run.
- Keep account selection aligned with the discovered `accountNumber` field and avoid treating `meteringPointNumber` as an interchangeable payment account identifier.
- Improve CLI/MCP descriptions and skill guidance so assistants can query a single discovered account without unnecessary confirmation and without leaking sensitive full identifiers in summaries.
- Require user-facing monthly usage summaries to present `dailyDetails` as a Markdown table with date, kWh, daily charge, and optional notes when daily charges are unavailable or zero while the monthly total is non-zero.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `mcp-tools`: Account input validation and tool descriptions will accept discovered payment account identifiers instead of assuming a fixed 16-digit length.
- `skill-package`: CLI validation, skill instructions, and answer formatting guidance will use discovered account numbers safely and table daily usage details.
- `multi-user-profiles`: Account-aware querying will treat listed account records as the source of truth for valid payment account identifiers across profiles.

## Impact

- Affected code: `src/profile.ts`, `src/query-service.ts`, `src/server.ts`, generated `skills/china-southern-power-grid-stat/scripts/cli.cjs`, and possibly `mcp/server.cjs`.
- Affected guidance: `skills/china-southern-power-grid-stat/SKILL.md` and README/usage examples if needed.
- Tests should cover 15-digit account selection, rejection of non-numeric account identifiers, unmatched account errors, and expected daily table guidance.
- No external dependency changes are expected.
