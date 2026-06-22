## 1. Token Configuration

- [x] 1.1 Add centralized server-side MCP token configuration for default lifetime, optional environment override, and required MCP purpose claim.
- [x] 1.2 Add a server helper that signs MCP-scoped JWTs with the configured lifetime and authenticated administrator subject.
- [x] 1.3 Add a server helper that verifies MCP Bearer JWTs, enforces expiration, and rejects tokens without the MCP purpose claim.

## 2. MCP Route Authentication

- [x] 2.1 Update `/api/mcp` to parse `Authorization: Bearer <token>` and call the MCP token verification helper.
- [x] 2.2 Ensure missing, malformed, expired, invalid, or wrong-purpose tokens return HTTP 401 JSON without invoking the MCP transport.
- [x] 2.3 Ensure valid unexpired MCP-scoped tokens allow the request to reach the MCP Streamable HTTP transport.

## 3. Dashboard Credential Flow

- [x] 3.1 Update the dashboard credential action to request or generate a long-lived MCP-scoped token instead of relying on the short default JWT.
- [x] 3.2 Display token lifetime or expiration date in the MCP credential dialog.
- [x] 3.3 Update credential dialog copy to describe the token as a long-lived secret and explain rotation guidance.

## 4. Documentation

- [x] 4.1 Update README MCP integration instructions to describe the long-lived Bearer token, default lifetime, and replacement of old copied tokens.
- [x] 4.2 Update the guide-only Skill instructions to match the MCP tool surface, long-lived Bearer token expectation, and unauthorized credential handling.
- [x] 4.3 Document token rotation guidance and deployment security expectations for local/private and remote deployments.

## 5. Tests

- [x] 5.1 Add token helper tests for long-lived expiration, MCP purpose claim, expired token rejection, and wrong-purpose JWT rejection.
- [x] 5.2 Add MCP route tests for missing Authorization, malformed Authorization, expired Bearer token, wrong-purpose JWT, and valid MCP token.
- [x] 5.3 Add a lightweight documentation or snapshot check, if existing test patterns support it, to keep Skill MCP tool names aligned with the server tool list.
- [x] 5.4 Run the relevant test suite and lint checks, then fix any regressions.
