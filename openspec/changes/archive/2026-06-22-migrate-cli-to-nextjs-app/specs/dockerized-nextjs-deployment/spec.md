## ADDED Requirements

### Requirement: Production Docker image
The system SHALL provide a Docker build for the Next.js application.

#### Scenario: Docker image is built
- **WHEN** the Docker build command is run from the project root
- **THEN** the image installs required dependencies
- **AND** the image builds the Next.js application successfully
- **AND** the image contains the runtime files needed to start the web server

#### Scenario: Container starts
- **WHEN** the built image is run with the documented environment variables and port mapping
- **THEN** the container starts the production Next.js server
- **AND** the dashboard is reachable over HTTP

### Requirement: Persistent SQLite volume
The Docker runtime SHALL support persisting SQLite data outside the container filesystem.

#### Scenario: Data volume is mounted
- **WHEN** the container runs with a mounted data directory
- **THEN** the SQLite database is created or opened inside that mounted directory
- **AND** profiles and snapshots survive container restart

#### Scenario: Data volume is missing
- **WHEN** the container runs without a mounted data directory
- **THEN** the application still starts using its configured fallback data path
- **AND** documentation warns that data may not survive container replacement

### Requirement: Runtime configuration
The Docker deployment SHALL document and honor required runtime configuration.

#### Scenario: Database path is configured
- **WHEN** the container receives a database path or data directory environment variable
- **THEN** the application uses that value for SQLite storage
- **AND** the runtime does not require files under `cli-src`

#### Scenario: Host and port are configured
- **WHEN** the container is started with a port mapping
- **THEN** the Next.js server listens on the documented container port
- **AND** the user can access the dashboard from the host

### Requirement: Container build verification
The project SHALL include a verifiable Docker packaging workflow.

#### Scenario: Packaging is checked
- **WHEN** the implementation is complete
- **THEN** maintainers can run a documented Docker build command
- **AND** maintainers can run a documented container command to smoke test the dashboard and SQLite persistence
