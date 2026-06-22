## ADDED Requirements

### Requirement: App Router dashboard shell
The system SHALL provide a Next.js App Router dashboard as the primary user-facing entry point for electricity account operations.

#### Scenario: User opens the root page
- **WHEN** a user visits `/`
- **THEN** the system renders the operational electricity dashboard
- **AND** the page exposes profile selection, session status, account discovery, balance lookup, and monthly usage lookup workflows without requiring command-line arguments

#### Scenario: No configured profile exists
- **WHEN** the dashboard loads and no usable profile exists
- **THEN** the system shows an actionable empty state for logging into a profile
- **AND** the system does not attempt account, balance, or usage queries until a profile is available

### Requirement: shadcn/ui component usage
The dashboard SHALL use the configured shadcn/ui component system for reusable UI primitives.

#### Scenario: Dashboard controls are implemented
- **WHEN** the implementation adds buttons, forms, selects, tabs, dialogs, alerts, badges, skeletons, menus, or table primitives
- **THEN** the system uses existing shadcn/ui components from `components/ui` when available
- **AND** missing reusable primitives are added through the configured shadcn/ui CLI setup before being used by domain components
- **AND** component API usage follows `.agents/skills/shadcn/SKILL.md` and the referenced rule files

#### Scenario: Domain components are implemented
- **WHEN** the implementation creates dashboard-specific components for profiles, accounts, balances, usage, or errors
- **THEN** those components compose shadcn/ui primitives rather than redefining base control behavior and styling from scratch
- **AND** lucide icons are used where icon buttons or command affordances are needed

#### Scenario: shadcn base components are composed
- **WHEN** a shadcn component requires trigger or slot composition
- **THEN** the implementation uses the API appropriate for the configured `base` primitive system
- **AND** it does not use Radix-only `asChild` patterns where the installed shadcn base component expects `render`

### Requirement: shadcn/ui form and state patterns
The dashboard SHALL follow the local shadcn skill rules for form layout, loading states, status display, empty states, and feedback.

#### Scenario: Forms are implemented
- **WHEN** the dashboard adds login, filter, or query forms
- **THEN** form layout uses shadcn `FieldGroup` and `Field`
- **AND** validation uses `data-invalid` on the field and `aria-invalid` on the control

#### Scenario: Choice controls are implemented
- **WHEN** the dashboard offers 2 to 7 mutually exclusive or multi-select options
- **THEN** the implementation uses shadcn `ToggleGroup` and `ToggleGroupItem`
- **AND** it does not emulate toggle state by manually switching Button variants

#### Scenario: Feedback states are implemented
- **WHEN** the dashboard displays warnings, empty states, loading placeholders, or status labels
- **THEN** warnings use `Alert`, empty states use `Empty`, loading placeholders use `Skeleton`, and status labels use `Badge`
- **AND** loading buttons use a `Spinner` with `disabled`, not an unsupported loading prop

#### Scenario: shadcn styling rules are applied
- **WHEN** dashboard components define layout and state styles
- **THEN** the implementation uses semantic tokens and built-in component variants for visual styling
- **AND** it uses `gap-*` instead of `space-*`, `size-*` for equal dimensions, `truncate` shorthand, and `cn()` for conditional classes

### Requirement: Server-side electricity API routes
The system SHALL expose Next.js App Router server endpoints for the migrated CLI operations.

#### Scenario: Profile API is requested
- **WHEN** the client requests configured profiles
- **THEN** the system returns profile metadata without session tokens
- **AND** the response identifies the default or selected profile when available

#### Scenario: Account discovery API is requested
- **WHEN** the client requests accounts for a selected profile or all profiles
- **THEN** the system queries the migrated account discovery service
- **AND** the response includes accounts and per-profile errors in a structured JSON shape

#### Scenario: Balance API is requested
- **WHEN** the client requests balances for selected accounts
- **THEN** the system validates the profile and account selection before calling upstream services
- **AND** the response includes balance, arrears, account metadata, freshness timestamp, and per-account errors

#### Scenario: Usage API is requested
- **WHEN** the client requests monthly usage for selected accounts, year, and month
- **THEN** the system validates the date and account selection before calling upstream services
- **AND** the response includes monthly totals, ladder information, daily details, freshness timestamp, and per-account errors

#### Scenario: Session verification API is requested
- **WHEN** the client requests verification for one or more profiles
- **THEN** the system validates each stored session with the upstream service
- **AND** the response reports validity per profile without exposing raw credentials

### Requirement: Dashboard interaction states
The system SHALL present loading, success, empty, partial failure, and failure states for each dashboard workflow.

#### Scenario: Query is in progress
- **WHEN** the user triggers account, balance, usage, login, or verification work
- **THEN** the relevant controls show a loading state
- **AND** duplicate submissions for the same pending action are prevented

#### Scenario: Query partially fails
- **WHEN** a multi-profile or multi-account query returns both successful records and errors
- **THEN** the dashboard shows successful records
- **AND** the dashboard displays the associated profile or account error messages without discarding successful data

#### Scenario: Query fully fails
- **WHEN** a requested operation returns no usable result
- **THEN** the dashboard shows the error message and a retry path
- **AND** the system avoids displaying stale data as if it were freshly queried

### Requirement: Electricity usage visualization
The system SHALL provide a clear monthly usage view for each selected electricity account.

#### Scenario: Monthly usage exists
- **WHEN** usage data is available for a selected account and month
- **THEN** the dashboard displays monthly total cost, monthly total kWh, ladder information, and daily rows
- **AND** the dashboard provides a visual daily usage or cost trend suitable for comparing days in the month

#### Scenario: Monthly usage fallback omits charges
- **WHEN** the upstream fallback can retrieve daily kWh but not daily charge
- **THEN** the dashboard clearly distinguishes zero or unavailable charge values from confirmed charge data
- **AND** the monthly totals remain visible when available

### Requirement: Sensitive display masking
The dashboard SHALL mask sensitive profile and account details by default while preserving usability.

#### Scenario: Account rows are displayed
- **WHEN** account records are shown in the dashboard
- **THEN** full session tokens are never displayed
- **AND** account numbers, addresses, and user names are masked or truncated unless the user explicitly expands a detail view

#### Scenario: Errors are displayed
- **WHEN** an error message is shown to the user
- **THEN** the message omits raw session tokens, passwords, SMS codes, and serialized credential payloads
