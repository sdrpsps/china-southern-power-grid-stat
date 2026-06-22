## Context

The project is currently a fresh Next.js app with a default `app/page.tsx`, while the existing business logic lives under `cli-src`. The CLI exposes actions for listing profiles, discovering electricity accounts, verifying sessions, querying balances, and querying monthly usage. Supporting modules contain the China Southern Power Grid client, profile registry handling, local session loading, validation, and MCP tool wrappers.

The implementation must migrate the usable behavior into the Next.js App Router without creating new files in `cli-src`. SQLite is the required data store and Drizzle ORM is the required database access layer. The app must also be packaged with Docker so it can run as a deployable web service with persistent data. The project has shadcn/ui initialized with `components.json`, `@/components/ui`, `@/lib/utils`, Tailwind CSS variables, and lucide icons; dashboard UI should build on that component system and follow `.agents/skills/shadcn/SKILL.md`.

`npx shadcn@latest info --json` reports Next.js 16.2.9, App Router/RSC enabled, TypeScript, Tailwind v4, style `base-nova`, primitive base `base`, icon library `lucide`, UI alias `@/components/ui`, and currently installed component `button`.

## Goals / Non-Goals

**Goals:**

- Build the actual web app as the first screen, not a marketing page.
- Move reusable CSG client and query logic into new Next.js server-side modules outside `cli-src`.
- Provide App Router pages and API route handlers or server actions for login/session management, profiles, account discovery, balance queries, monthly usage queries, and session verification.
- Use shadcn/ui components for reusable UI primitives and add missing primitives through the shadcn workflow when needed.
- Persist profiles, session metadata, account snapshots, balance snapshots, usage snapshots, and operation logs in SQLite through Drizzle ORM.
- Keep sensitive data server-side and avoid exposing full tokens, passwords, SMS codes, full account numbers, addresses, or user names unless needed for the selected workflow.
- Add Docker build and runtime files for production deployment with a mounted SQLite data directory.

**Non-Goals:**

- Preserve the CLI as the primary product surface.
- Add files to `cli-src` or rely on importing new application code from `cli-src`.
- Build multi-tenant remote authentication, cloud account sync, or external managed database support.
- Guarantee upstream CSG API availability; the app will surface upstream errors clearly and retain last known local snapshots when available.
- Redesign the existing MCP protocol behavior except where shared migrated modules naturally reduce duplication.

## Decisions

1. **Create a new server-side domain layer outside `cli-src`.**

   The migration will place CSG client logic, validation, profile selection, query orchestration, and DTO mapping under a new application-owned path such as `lib/` or `src/`, and App Router code will import from that layer. This avoids mutating `cli-src` while allowing the old code to be used as a reference. Alternative considered: import directly from `cli-src`; rejected because the user requested implementation in Next.js and because CLI modules depend on process arguments, file paths, and command-line assumptions.

2. **Use App Router route handlers as the external UI/API boundary.**

   Route handlers under `app/api/**/route.ts` will expose JSON endpoints for profiles, login/session, accounts, balances, usage, and verification. Server components can load initial data, while client components handle filters, refresh actions, month selection, forms, tables, and charts. Alternative considered: server actions only; route handlers are clearer for Docker deployment checks, browser debugging, and future automation clients.

3. **Persist application state in SQLite via Drizzle ORM.**

   Drizzle schema will define typed tables for profiles, sessions, accounts, balance snapshots, monthly usage snapshots, usage daily rows, and operation logs. SQLite is local, simple to mount in Docker, and matches the deployment constraint. Alternative considered: keep JSON registry and session files only; rejected because the request explicitly requires SQLite and Drizzle.

4. **Store session tokens in SQLite but keep them server-only.**

   Session records will store the data required to initialize the CSG client, while API responses only return metadata such as profile alias, label, validity, creation/update timestamps, and masked identifiers. Passwords and SMS codes are never stored. Alternative considered: continue writing session JSON files or expose manual session import; rejected because the requested web flow should log in directly and create profiles from verified login results.

5. **Cache query results as snapshots, not as the source of truth.**

   Account, balance, and usage tables will hold the latest or historical query results for display and troubleshooting. Explicit refresh actions will call the upstream CSG API and then write new snapshots. The UI will show freshness timestamps and partial errors. Alternative considered: always query live and store nothing; rejected because it weakens the requested SQLite usage and provides a poor deployment experience when upstream calls fail.

6. **Package with a production Next.js standalone Docker image.**

   The Docker build will run dependency install, Drizzle generation or migration preparation, `next build`, and start the standalone server. Runtime configuration will include a data directory such as `/data` for SQLite and environment variables for database URL/path and optional CSG configuration. Alternative considered: Node image with `next start` and full `node_modules`; acceptable but larger and less deployment-friendly.

7. **Use shadcn/ui as the UI primitive layer.**

   Dashboard controls, forms, tables, tabs, dialogs, alerts, badges, skeletons, menus, and buttons will be composed from shadcn/ui components under `components/ui`. Missing primitives should be added with `npx shadcn@latest add` after checking installed components and, when implementing a component, using `npx shadcn@latest docs <component>` to confirm the correct API. Because this project uses shadcn `base`, trigger composition must use `render` rather than Radix `asChild` where the component API requires it. Alternative considered: hand-rolled component primitives; rejected because the project already has shadcn/ui installed and the user explicitly requested it for UI components.

8. **Apply the local shadcn skill rules during UI implementation.**

   Forms use `FieldGroup` and `Field`; option sets with 2 to 7 choices use `ToggleGroup`; callouts use `Alert`; empty states use `Empty`; loading placeholders use `Skeleton`; status labels use `Badge`; loading buttons compose `Spinner` plus `disabled` rather than an `isLoading` prop; overlays include accessible titles; cards use `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` as appropriate. Styling uses semantic tokens and built-in variants, `gap-*` instead of `space-*`, `size-*` for equal dimensions, `truncate` shorthand, `cn()` for conditional classes, and no manual overlay z-index. Lucide icons inside shadcn components use `data-icon` and avoid manual sizing classes.

## Risks / Trade-offs

- [Risk] Upstream CSG endpoints may change, throttle, or reject server-origin requests -> Mitigation: preserve existing headers and fallback behavior from `cli-src/csg-client.ts`, return structured partial errors, and store query logs for diagnosis.
- [Risk] SQLite file permissions differ between local and Docker runtime -> Mitigation: use a configurable data path, create the data directory at startup or migration time, and document volume mounts.
- [Risk] Session tokens are sensitive at rest -> Mitigation: keep tokens out of client responses, avoid logging them, support `.env`/filesystem permission guidance, and limit token reads to server-side modules.
- [Risk] Migrating from JSON profiles to SQLite can strand existing users -> Mitigation: make the Web UI capable of creating replacement profiles through SMS or QR login without writing files under `cli-src`.
- [Risk] Route handlers could run in an Edge runtime where Node crypto and SQLite are unavailable -> Mitigation: force Node.js runtime for routes that use crypto, filesystem, or SQLite.
- [Risk] Long upstream requests can make the UI feel stuck -> Mitigation: use explicit loading states, disable repeated submit actions, and write partial successes and errors as first-class results.
- [Risk] Mixing custom primitives with shadcn/ui can create inconsistent interaction and styling -> Mitigation: use shadcn/ui for base controls, follow `.agents/skills/shadcn` rules, and reserve custom components for domain composition.

## Migration Plan

1. Add dependencies for Drizzle ORM, SQLite driver, migrations, validation, and only the UI/charting utilities not already covered by shadcn/ui and the existing component stack.
2. Create the Drizzle schema, database connection helper, migration configuration, and data directory handling outside `cli-src`.
3. Port the CSG client, constants, validation, profile/session service, and query service into new server-side modules.
4. Implement App Router API route handlers for profiles, sessions/login, verification, accounts, balances, and usage.
5. Replace the default `app/page.tsx` with the dashboard shell and add focused client components for profile selection, SMS/QR login, account table, balance panel, usage month selector, daily usage table/chart, and error states using shadcn/ui primitives and the local shadcn skill rules.
6. Add tests for validation, database persistence, route handlers, and key query-service transformations using mocked upstream calls.
7. Add Dockerfile, `.dockerignore`, runtime entrypoint or start script, and documentation for volume and environment variables.
8. Run lint/build, database migration verification, and Docker build locally.

Rollback is straightforward before data migration: stop the container and continue using the old CLI/MCP tooling. After SQLite data is created, rollback does not need data conversion because the old CLI can continue using existing file-based sessions; any new Web-only profiles should be regenerated through the applicable login flow if CLI use is required.

## Open Questions

- Should Web login initially support QR login, SMS login, password+SMS login, or all direct login flows in the first implementation?
- Should session tokens be encrypted at rest with an application secret, or is filesystem-level protection acceptable for the first Docker deployment?
- Should historical balance and usage snapshots be retained indefinitely, or should the app keep only the latest result per profile/account/month?
