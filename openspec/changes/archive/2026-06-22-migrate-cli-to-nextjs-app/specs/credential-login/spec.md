## ADDED Requirements

### Requirement: Web session creation
The system SHALL support creating South China Power Grid sessions through direct login flows in the Next.js Web application.

#### Scenario: Web login succeeds
- **WHEN** a user completes a supported Web login flow
- **THEN** the system initializes the CSG client and verifies the session
- **AND** the generated session is persisted server-side for the selected profile
- **AND** the browser response excludes raw token contents

#### Scenario: QR login channel is selected
- **WHEN** a user creates a QR login code in the Web app
- **THEN** the dashboard lets the user choose WeChat, Alipay, or CSG App as the QR login channel
- **AND** the selected channel is sent to the upstream QR creation request
- **AND** the dashboard identifies which channel the generated QR code belongs to

#### Scenario: Web login fails
- **WHEN** a Web login flow fails, times out, or returns an invalid session
- **THEN** the system does not persist the failed session as active
- **AND** the dashboard displays a sanitized failure reason

### Requirement: Web credential handling
The system SHALL keep login secrets and session credentials out of client-visible output except where the user directly enters them into a secure form.

#### Scenario: SMS code is submitted
- **WHEN** a user submits an SMS verification code through the Web app
- **THEN** the system uses the code only for the login request
- **AND** the system does not store the SMS code in SQLite or operation logs

#### Scenario: Password is submitted
- **WHEN** a user submits a password for a password plus SMS flow
- **THEN** the system uses the password only for the encrypted upstream login request
- **AND** the system does not store the password in SQLite, browser state, or operation logs

#### Scenario: Session status is displayed
- **WHEN** the dashboard displays session status
- **THEN** it shows metadata such as profile alias, label, validity, and update time
- **AND** it never displays the full raw auth token
