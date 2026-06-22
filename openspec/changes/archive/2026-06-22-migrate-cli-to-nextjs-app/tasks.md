## 1. Project Setup

- [x] 1.1 Add Drizzle ORM, SQLite driver, migration tooling, validation, and only UI/chart dependencies not covered by the existing shadcn/ui setup.
- [x] 1.2 Add database configuration files for Drizzle migrations and a configurable SQLite data path.
- [x] 1.3 Create server-only module directories outside `cli-src` for database, CSG client, profile/session services, query services, and DTO helpers.
- [x] 1.4 Run `npx shadcn@latest info --json` before UI implementation and use its `base`, `aliases`, `iconLibrary`, and installed component list to guide imports and composition.
- [x] 1.5 Add required shadcn/ui primitives through the configured shadcn workflow for forms, select controls, tabs, dialogs, alerts, badges, skeletons, tables, or menus as needed.
- [x] 1.6 For each shadcn primitive added or used beyond the existing Button, run `npx shadcn@latest docs <component>` and apply the documented API.
- [x] 1.7 Apply `.agents/skills/shadcn` rules for forms, composition, icons, styling, and base-vs-radix behavior.
- [x] 1.8 Confirm no new implementation files are created under `cli-src`.

## 2. SQLite and Drizzle Persistence

- [x] 2.1 Define Drizzle schema for profiles, sessions, electricity accounts, balance snapshots, monthly usage snapshots, daily usage rows, and operation logs.
- [x] 2.2 Implement SQLite connection initialization with Node.js runtime support and configurable data directory creation.
- [x] 2.3 Implement migration or schema initialization workflow for local development and Docker runtime.
- [x] 2.4 Implement repository functions for profiles, sessions, account snapshots, balance snapshots, usage snapshots, daily usage rows, and operation logs.
- [x] 2.5 Ensure repository responses never expose raw session tokens unless used inside server-only service code.

## 3. Migrated CSG Domain Logic

- [x] 3.1 Port constants, encryption helpers, response parsing, and CSG API client behavior from `cli-src` into the new server-only implementation area.
- [x] 3.2 Port profile alias, account number, year, month, and selector validation into reusable server-side helpers.
- [x] 3.3 Implement SQLite-backed profile resolution, default profile selection, all-profiles selection, and login-backed session persistence.
- [x] 3.4 Implement session initialization and verification using stored SQLite session data.
- [x] 3.5 Implement account discovery, balance query, and monthly usage query services with partial-success error handling.
- [x] 3.6 Persist successful account, balance, and usage query results as snapshots with freshness timestamps.
- [x] 3.7 Write sanitized operation logs for successful and failed profile, session, account, balance, usage, and verification operations.

## 4. App Router APIs

- [x] 4.1 Add profile API routes for listing, selecting default profile, and retrieving safe profile metadata.
- [x] 4.2 Add session/login API routes for supported Web login, validation, and verification.
- [x] 4.3 Add account discovery API routes supporting selected profile and all-profiles modes.
- [x] 4.4 Add balance API routes supporting single account, multiple accounts, and all accounts.
- [x] 4.5 Add monthly usage API routes supporting selected year/month, single or multiple accounts, and all accounts.
- [x] 4.6 Force Node.js runtime for API routes that use crypto, filesystem, SQLite, or upstream CSG client code.
- [x] 4.7 Standardize API response shapes for data, freshness timestamps, and sanitized errors.

## 5. Dashboard UI

- [x] 5.1 Replace the default root page with the electricity dashboard shell composed from shadcn/ui layout and control primitives.
- [x] 5.2 Build profile/session controls with shadcn/ui primitives for empty state, profile selection, default profile indicator, Web login, and session verification.
- [x] 5.3 Build account discovery UI with shadcn/ui loading, empty, success, partial failure, and retry states.
- [x] 5.4 Build balance query UI for selected accounts and all accounts, including freshness timestamps and partial errors, using shadcn/ui tables, badges, alerts, and buttons where applicable.
- [x] 5.5 Build monthly usage UI with shadcn/ui year/month controls, monthly totals, ladder data, daily table, and daily trend visualization.
- [x] 5.6 Mask account numbers, addresses, user names, and session-sensitive data by default, with an explicit detail workflow when needed.
- [x] 5.7 Use shadcn `FieldGroup`/`Field` for forms, `ToggleGroup` for small option sets, `Alert` for callouts, `Empty` for empty states, `Skeleton` for loading, `Badge` for statuses, and full Card composition for dashboard sections.
- [x] 5.8 Use lucide icons according to the shadcn skill: `data-icon` in buttons, no manual icon sizing inside shadcn components, and icon component objects rather than string lookups.
- [x] 5.9 Ensure controls have stable responsive layouts and no text overlap across mobile and desktop widths.

## 6. Tests and Verification

- [x] 6.1 Add unit tests for validation helpers and sensitive-data masking.
- [x] 6.2 Add tests for Drizzle repository functions using a temporary SQLite database.
- [x] 6.3 Add tests for profile resolution, session verification behavior, and partial-success query orchestration with mocked upstream calls.
- [x] 6.4 Add route handler tests or integration tests for profiles, accounts, balances, usage, and verification APIs.
- [x] 6.5 Run lint and production build successfully.
- [x] 6.6 Verify the dashboard manually with mocked or configured local session data.

## 7. Docker Packaging

- [x] 7.1 Add `.dockerignore` to exclude local credentials, SQLite files, build outputs, and dependencies from build context where appropriate.
- [x] 7.2 Add a production Dockerfile for the Next.js application using a Node.js runtime compatible with Next.js, SQLite, and Drizzle.
- [x] 7.3 Add container startup handling for database path configuration and migration/schema initialization.
- [x] 7.4 Document Docker build, run, port mapping, environment variables, and persistent volume usage.
- [x] 7.5 Build the Docker image locally and smoke test that the dashboard starts and writes SQLite data to the configured volume.
