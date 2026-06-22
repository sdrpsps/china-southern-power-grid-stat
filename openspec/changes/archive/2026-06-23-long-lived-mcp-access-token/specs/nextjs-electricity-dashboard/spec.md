## ADDED Requirements

### Requirement: Dashboard MCP credential display
The dashboard SHALL expose MCP credentials as long-lived API secrets with clear lifetime and rotation guidance.

#### Scenario: Administrator views MCP credential
- **WHEN** an authenticated administrator opens the MCP credential dialog
- **THEN** the dashboard requests a fresh long-lived MCP access token
- **AND** the dialog displays the token only after explicit user action
- **AND** the dialog states the token lifetime or expiration date

#### Scenario: Administrator copies MCP credential
- **WHEN** an authenticated administrator copies the MCP credential
- **THEN** the copied value is suitable for use as `Authorization: Bearer <token>` in MCP client configuration
- **AND** the copied value does not include Southern Power Grid upstream session tokens

#### Scenario: Credential security guidance is shown
- **WHEN** the MCP credential dialog is displayed
- **THEN** the dashboard warns that the token is a long-lived secret
- **AND** the dashboard explains that leaked tokens should be rotated by generating a replacement or rotating server signing secrets according to deployment guidance
