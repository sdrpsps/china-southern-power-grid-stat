## ADDED Requirements

### Requirement: Web-managed user profiles
The system SHALL manage multiple user profiles through the Next.js Web application backed by SQLite.

#### Scenario: Profile list is displayed
- **WHEN** the user opens the profile area in the dashboard
- **THEN** the system lists stored profiles with alias, optional label, default indicator, session status, and timestamps
- **AND** raw session tokens are not displayed

#### Scenario: Profile is selected
- **WHEN** the user selects a profile in the dashboard
- **THEN** subsequent account, balance, usage, and verification operations use that profile unless the user chooses all profiles or another profile
- **AND** results identify the profile used for each record

#### Scenario: Profile alias is invalid
- **WHEN** the user submits a profile alias that does not satisfy alias validation rules
- **THEN** the system rejects the profile change
- **AND** the dashboard displays a validation error without writing the invalid profile

### Requirement: Web all-profiles operations
The system SHALL support all-profiles account discovery, balance lookup, usage lookup, and session verification from the Web app.

#### Scenario: Accounts are listed for all profiles
- **WHEN** the user requests account discovery across all profiles
- **THEN** the system queries each profile independently
- **AND** the dashboard displays successful account records and per-profile errors

#### Scenario: Balances are queried for all profiles
- **WHEN** the user requests balances for all accounts across all profiles
- **THEN** the system queries each available profile and account independently
- **AND** the dashboard displays per-profile, per-account success and error records

#### Scenario: Sessions are verified for all profiles
- **WHEN** the user requests verification across all profiles
- **THEN** the system reports validity for each profile independently
- **AND** a failed profile does not hide successful verification results from other profiles

### Requirement: Profile creation from Web login
The system SHALL create or update SQLite-backed profiles from successful Web login flows.

#### Scenario: SMS login creates a profile
- **WHEN** the user completes SMS or password-plus-SMS login with a valid profile alias
- **THEN** the system creates or updates a SQLite-backed profile without writing new files under `cli-src`
- **AND** the stored profile is associated with the verified server-side session

#### Scenario: QR login creates a profile
- **WHEN** the user completes QR login with a valid profile alias
- **THEN** the system creates or updates a SQLite-backed profile without writing new files under `cli-src`
- **AND** the stored profile is associated with the verified server-side session
