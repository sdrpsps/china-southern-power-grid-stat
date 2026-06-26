## 1. Database Schema
- [x] 1.1 Remove definitions for caching tables `electricityAccounts`, `balanceSnapshots`, `usageMonths`, `usageDays` in `lib/db/schema.ts`.
- [x] 1.2 Remove their associated relations in `profilesRelations`.
- [x] 1.3 Remove type exports for deleted tables (`AccountRow`, `BalanceSnapshotRow`, `UsageMonthRow`, `UsageDayRow`).
- [x] 1.4 Remove cache table creation statements in `lib/db/migrate.ts`.

## 2. Repositories
- [x] 2.1 Remove snapshot-related database operations (`upsertAccountSnapshot`, `listAccountSnapshots`, `insertBalanceSnapshot`, `upsertUsageSnapshot`) in `lib/services/repositories.ts`.

## 3. Query Service
- [x] 3.1 Refactor `listAccounts`, `queryBalances`, and `queryUsage` to bypass caching writes in `lib/services/queries.ts`.
- [x] 3.2 Remove `getCachedAccounts` in `lib/services/queries.ts`.

## 4. API Routes
- [x] 4.1 Update `GET /api/accounts` in `app/api/accounts/route.ts` to always query live via `listAccounts`.

## 5. Verification
- [x] 5.1 Remove caching tests from `tests/repositories.test.ts`.
- [x] 5.2 Generate database migration using `npm run db:generate`.
- [x] 5.3 Verify all tests pass by running `npm run test`.
- [x] 5.4 Drop obsolete cache tables from the local SQLite database.
