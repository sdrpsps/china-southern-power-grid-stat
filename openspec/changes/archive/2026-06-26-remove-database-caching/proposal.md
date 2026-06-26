## Why

Caching electricity query snapshots (accounts, balances, monthly daily details) in the local database creates unnecessary data redundancy and synchronization complexity. Since the data volume is small and the application always needs up-to-date information, it is cleaner and simpler to make direct live network requests to the Southern Power Grid API (or mock client) whenever accounts, balances, or daily details are queried.

This avoids maintaining obsolete database tables (`electricity_accounts`, `balance_snapshots`, `usage_months`, `usage_days`), simplifies database migrations, reduces privacy/leakage risks by not persisting sensitive user electricity data locally, and ensures the UI always shows current data.

## What Changes

- Completely remove database tables `electricity_accounts`, `balance_snapshots`, `usage_months`, and `usage_days`.
- Remove database relations and typescript typings associated with the removed tables.
- Remove all snapshot CRUD/upsert repository functions.
- Update listing and querying services to always return live fetched data without writing or reading from database snapshot tables.
- Update `/api/accounts` endpoint to perform live account queries on all calls.
- Update repositories and queries unit tests to clean up caching assertions and focus on live mock-based behaviors.
- Generate a new migration reflecting the deleted tables.

## Capabilities

### Deleted Capabilities
- `database-snapshot-caching`: Persistence of electricity accounts, balance snapshots, monthly daily logs, and usage logs in SQLite.

### Modified Capabilities
- `account-querying`: Querying accounts always retrieves live account details from the CSG API.
- `balance-querying`: Querying balances always retrieves live balances from the CSG API.
- `usage-querying`: Querying usage always retrieves live month usage and daily details from the CSG API.

## Impact

- Affected code: `lib/db/schema.ts`, `lib/services/repositories.ts`, `lib/services/queries.ts`, `app/api/accounts/route.ts`, and test files.
- Database: 4 tables removed, resulting in a cleaner schema (only profiles, sessions, operation logs, and Better Auth tables remain).
- Network: All query operations now require live outbound connection (or mock mode), making the UI fully stateless for query data.
