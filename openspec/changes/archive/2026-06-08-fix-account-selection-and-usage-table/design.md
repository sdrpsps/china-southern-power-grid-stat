## Context

The failed skill run exposed a mismatch between the service contract and real account data. Account discovery can return 15-digit `accountNumber` values, while `validateAccountNumber` required exactly 16 digits. After that failure, the run retried with `meteringPointNumber`, which is a distinct field and is not accepted by account selection. The answer eventually succeeded only after bypassing the strict validation path, and the final daily details were rendered as compressed text instead of a table.

The repository has three affected surfaces: shared query validation in TypeScript, generated/deployed MCP and Skill artifacts, and the assistant-facing Skill instructions.

## Goals / Non-Goals

**Goals:**

- Let balance and usage queries accept payment account numbers that were returned by account discovery, including 15-digit numeric values.
- Preserve strict rejection for empty, non-numeric, or unbound account identifiers.
- Keep `accountNumber` and `meteringPointNumber` semantics separate in code, tool descriptions, and instructions.
- Make monthly usage answers easier to inspect by requiring Markdown tables for daily details.
- Update build artifacts and tests so deployed MCP/Skill behavior matches source behavior.

**Non-Goals:**

- Changing South China Grid upstream API calls or account discovery payloads.
- Treating `meteringPointNumber` as a supported alias for payment account selection.
- Estimating daily charges when upstream daily `charge` values are zero or absent.
- Introducing new dependencies.

## Decisions

1. Relax account-number syntax validation to numeric strings with a bounded practical length, then rely on discovered account binding to prove whether the account is usable.

   Rationale: account discovery is the source of truth. A fixed 16-digit rule is contradicted by observed data. Numeric-only validation still catches malformed input early, while binding lookup catches unknown accounts before balance/usage calls.

   Alternative considered: accept both `accountNumber` and `meteringPointNumber` for selection. Rejected because these identifiers are used for different upstream calls and conflating them caused one of the failed retries.

2. Keep public API field names unchanged.

   Rationale: callers already receive `accountNumber`, `meteringPointNumber`, and related fields. The fix is to make validation and instructions match those fields, not to rename the schema.

   Alternative considered: introduce a generic `accountId`. Rejected because it would make the distinction between payment account and metering point less clear.

3. Put answer-format guidance in `SKILL.md`, not in CLI JSON.

   Rationale: the CLI and MCP should keep returning structured JSON. The assistant is responsible for transforming `dailyDetails` into a human-readable table and for noting when daily charge rows are unavailable.

   Alternative considered: add a Markdown output mode to the CLI. Rejected to preserve the existing machine-readable output contract.

## Risks / Trade-offs

- Broader numeric validation might accept a syntactically valid but nonexistent account number → Mitigation: selected accounts are still matched against account discovery results before any account-specific upstream query.
- Some upstream account formats may be shorter or longer than the chosen range → Mitigation: use a generous documented numeric range and add tests around the known 15-digit case.
- Large daily tables can be verbose → Mitigation: monthly usage has at most one row per day, which is acceptable for inspection and clearer than compressed prose.
