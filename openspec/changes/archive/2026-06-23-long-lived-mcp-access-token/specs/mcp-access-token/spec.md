## ADDED Requirements

### Requirement: Long-lived MCP access token issuance
The system SHALL issue MCP access tokens with an explicit long-lived expiration and MCP-specific token purpose.

#### Scenario: Dashboard requests MCP credential
- **WHEN** an authenticated administrator requests an MCP credential
- **THEN** the system returns a Bearer token that includes an expiration claim at least 300 days after issuance
- **AND** the token includes a machine-verifiable MCP purpose claim
- **AND** the response does not expose Southern Power Grid upstream session tokens

#### Scenario: Token payload is decoded
- **WHEN** the generated MCP token payload is decoded
- **THEN** the payload contains issued-at and expiration timestamps
- **AND** the expiration timestamp is later than the issued-at timestamp by the configured MCP token lifetime
- **AND** the payload identifies the authenticated administrator as the subject

### Requirement: MCP token lifetime configuration
The system SHALL define MCP token lifetime in one centralized server-side configuration.

#### Scenario: Default lifetime is used
- **WHEN** no deployment-specific MCP token lifetime override is configured
- **THEN** newly issued MCP access tokens use the documented default long-lived lifetime
- **AND** the default lifetime is not inherited implicitly from Better Auth's short JWT default

#### Scenario: Invalid lifetime configuration
- **WHEN** deployment configuration provides an invalid MCP token lifetime
- **THEN** the system fails closed or falls back to the documented default
- **AND** the application does not issue a token with no expiration by accident

### Requirement: MCP token verification
The system SHALL verify MCP access tokens cryptographically and reject expired, malformed, or wrong-purpose tokens.

#### Scenario: Valid MCP token
- **WHEN** a valid, unexpired MCP-scoped token is verified
- **THEN** verification succeeds
- **AND** the verified payload is available to the MCP route guard

#### Scenario: Expired MCP token
- **WHEN** an MCP-scoped token has an expiration timestamp in the past
- **THEN** verification fails
- **AND** the token cannot authorize an MCP request

#### Scenario: Wrong-purpose JWT
- **WHEN** a valid JWT lacks the MCP purpose claim
- **THEN** verification for MCP access fails
- **AND** the token cannot authorize an MCP request
