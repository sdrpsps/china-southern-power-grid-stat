## Context

The application previously stored accounts, balances, and monthly usage in SQLite tables. This was designed to act as a cache. However, since electricity data changes and the UI must display current info, queries always write the latest state to database tables, and the UI periodically requests refresh. 

To simplify the codebase and database maintenance, we decided to drop the caching tables completely and make all queries stateless (hitting the CSG API directly and returning the data).

## Goals / Non-Goals

**Goals:**
- Drop cache-related database tables (`electricity_accounts`, `balance_snapshots`, `usage_months`, `usage_days`).
- Direct all queries to fetch live data from the CSG API and return it without database writes.
- Clean up the Drizzle ORM schemas, relations, and types.
- Ensure all automated unit tests continue to pass.

**Non-Goals:**
- Do not remove the `profiles` or `sessions` tables, as they store necessary credentials (tokens) required to make authorized calls to the CSG API.
- Do not change the JSON structure of the API or MCP tool responses.

## Decisions

1. **Remove account snapshot persistence but query accounts dynamically.**
   
   Instead of storing discovered accounts in `electricity_accounts`, we query them dynamically from the profile client. The API `/api/accounts` will perform a live fetch.

2. **Remove balance and usage snapshots.**
   
   `queryBalances` and `queryUsage` will no longer call `insertBalanceSnapshot` or `upsertUsageSnapshot`. They will return live-fetched data directly.

3. **Retain Operation Logs.**
   
   We keep `operation_logs` as they are useful for audit trails and debugging, and do not contain heavy cache data.

## Risks / Trade-offs

- Increased latency: Since we do not read accounts from local cache anymore, every dashboard load makes a network call to the Southern Power Grid API. However, since the account list is small and rarely changes, this latency is acceptable.

## Migration Plan

1. Drop caching tables from `lib/db/schema.ts` and update relations/types.
2. Clean up imports and snapshot-related database operations in `lib/services/repositories.ts`.
3. Refactor `lib/services/queries.ts` to fetch live data and remove database writes.
4. Update `/api/accounts/route.ts` to always query live.
5. Clean up repository and query tests.
6. Generate a new Drizzle migration.
