## ADDED Requirements

### Requirement: MCP HTTP Bearer authentication
The MCP HTTP endpoint SHALL require a valid long-lived MCP Bearer token before serving MCP protocol requests.

#### Scenario: Missing Authorization header
- **WHEN** a client calls `/api/mcp` without an `Authorization` header
- **THEN** the endpoint returns HTTP 401
- **AND** the MCP server transport is not invoked

#### Scenario: Malformed Authorization header
- **WHEN** a client calls `/api/mcp` with an `Authorization` header that is not `Bearer <token>`
- **THEN** the endpoint returns HTTP 401
- **AND** the response does not disclose signing or token parsing internals

#### Scenario: Valid MCP Bearer token
- **WHEN** a client calls `/api/mcp` with a valid unexpired MCP-scoped Bearer token
- **THEN** the endpoint accepts the request
- **AND** the request is passed to the MCP Streamable HTTP transport

#### Scenario: Expired MCP Bearer token
- **WHEN** a client calls `/api/mcp` with an expired MCP-scoped Bearer token
- **THEN** the endpoint returns HTTP 401
- **AND** no MCP tools are executed

#### Scenario: Valid non-MCP JWT
- **WHEN** a client calls `/api/mcp` with a valid JWT that does not carry the MCP purpose claim
- **THEN** the endpoint returns HTTP 401
- **AND** no MCP tools are executed

### Requirement: MCP auth failure response
The MCP HTTP endpoint SHALL return a consistent unauthorized response for invalid MCP credentials.

#### Scenario: Unauthorized request is rejected
- **WHEN** MCP authentication fails because the token is missing, malformed, expired, invalid, or wrong-purpose
- **THEN** the endpoint returns HTTP 401 with JSON content
- **AND** the response message states that a valid MCP Bearer token is required
- **AND** the response omits raw token contents
