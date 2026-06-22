## ADDED Requirements

### Requirement: Drizzle-managed SQLite database
The system SHALL use SQLite as the application datastore and SHALL access it through Drizzle ORM.

#### Scenario: Application starts with no database
- **WHEN** the application starts and the configured SQLite database file does not exist
- **THEN** the system can initialize the required schema through Drizzle-managed migrations or startup migration handling
- **AND** subsequent profile and query operations use that database file

#### Scenario: Database path is configured
- **WHEN** a database path or application data directory is provided by environment variable
- **THEN** the system stores the SQLite database at that configured location
- **AND** the system does not write application data into `cli-src`

### Requirement: Profile and session persistence
The system SHALL persist Web application profiles and session metadata in SQLite.

#### Scenario: Profile is created
- **WHEN** a user completes Web login with a profile alias
- **THEN** the system writes a profile row with alias, optional label, default flag or ordering metadata, and timestamps
- **AND** the alias is unique

#### Scenario: Session is stored
- **WHEN** a Web login succeeds
- **THEN** the system stores the server-side session data needed to initialize the CSG client
- **AND** API responses expose only session metadata, never the raw auth token

#### Scenario: Default profile changes
- **WHEN** the user marks a profile as default
- **THEN** the system persists that default selection
- **AND** later queries without an explicit profile use that default profile

### Requirement: Query snapshot persistence
The system SHALL persist account, balance, usage, and daily usage query results as SQLite snapshots.

#### Scenario: Accounts are discovered
- **WHEN** account discovery succeeds for a profile
- **THEN** the system upserts account snapshot records with profile, account number, area code, customer identifiers, metering point data, address, user name, and freshness timestamp

#### Scenario: Balance is queried
- **WHEN** a balance query succeeds for an account
- **THEN** the system writes a balance snapshot with balance, arrears, profile, account number, and queried timestamp

#### Scenario: Monthly usage is queried
- **WHEN** a monthly usage query succeeds for an account
- **THEN** the system writes one monthly usage snapshot
- **AND** the system writes the associated daily usage rows for that profile, account, year, and month

### Requirement: Operation logging
The system SHALL record query attempts and important profile/session actions in SQLite for troubleshooting.

#### Scenario: Operation succeeds
- **WHEN** a profile, account, balance, usage, login, or verification operation succeeds
- **THEN** the system writes an operation log entry with operation type, profile when available, status, timestamp, and non-sensitive summary

#### Scenario: Operation fails
- **WHEN** a profile, account, balance, usage, login, or verification operation fails
- **THEN** the system writes an operation log entry with operation type, profile when available, failure status, timestamp, and sanitized error message

### Requirement: SQLite data privacy
The persistence layer SHALL treat session tokens, account numbers, addresses, and user names as sensitive local data.

#### Scenario: Data is returned to the browser
- **WHEN** persisted records are returned through an API route
- **THEN** the system omits raw session tokens
- **AND** the system returns masked sensitive account fields unless the endpoint is explicitly serving an authorized detail workflow

#### Scenario: Data is logged
- **WHEN** the system writes operation logs or server logs
- **THEN** raw session tokens, passwords, SMS codes, and serialized credential payloads are excluded
