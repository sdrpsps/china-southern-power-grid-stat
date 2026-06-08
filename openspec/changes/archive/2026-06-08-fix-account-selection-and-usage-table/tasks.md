## 1. Root Cause Capture

- [x] 1.1 Add a regression note or test fixture for the observed 15-digit discovered `accountNumber` and distinct 16-digit `meteringPointNumber`.
- [x] 1.2 Confirm balance and usage selection paths use `accountNumber` for user-supplied payment account selection.

## 2. Account Validation

- [x] 2.1 Update shared account-number validation to accept numeric payment account identifiers returned by account discovery, including 15-digit values.
- [x] 2.2 Keep validation failures for empty values, non-numeric values, and obviously unsupported lengths.
- [x] 2.3 Preserve binding validation so numeric but unbound account numbers return the existing "not bound to profile" error.
- [x] 2.4 Update MCP input schema descriptions to remove the fixed 16-digit wording.

## 3. Skill Guidance And Display

- [x] 3.1 Update `skills/china-southern-power-grid-stat/SKILL.md` to say balance and usage commands must use `accountNumber`, not `meteringPointNumber`.
- [x] 3.2 Update the Skill guidance so a single clear account match can be queried directly while still protecting full account/address/user details in summaries.
- [x] 3.3 Add response-format guidance requiring monthly `dailyDetails` to be shown as a Markdown table with date, kWh, and daily charge/electricity amount.
- [x] 3.4 Add guidance to state that daily charge rows are unavailable when upstream returns zero daily charges but a non-zero monthly total.

## 4. Build Artifacts

- [x] 4.1 Rebuild the MCP bundle so `mcp/server.cjs` reflects validation and schema-description changes.
- [x] 4.2 Rebuild the Skill CLI bundle so `skills/china-southern-power-grid-stat/scripts/cli.cjs` reflects validation changes.

## 5. Verification

- [x] 5.1 Add or run focused validation covering accepted 15-digit account numbers and rejected non-numeric account numbers.
- [x] 5.2 Add or run focused validation covering `meteringPointNumber` not matching account selection when it is not a bound `accountNumber`.
- [x] 5.3 Run `pnpm run typecheck`.
- [x] 5.4 Run the relevant build command and verify generated artifacts exist.
- [x] 5.5 Manually inspect a sample monthly usage answer format to ensure daily details are tabular.
