## Why

Agent integrations currently rely on the dashboard-generated Better Auth JWT, which expires after the library default of 15 minutes. The MCP route also checks `auth.api.getSession()` instead of validating the Bearer JWT directly, so a copied JWT can fail even before expiration.

Users need a stable MCP credential for local or private agent configurations that remains valid for long-running assistant workflows without frequent manual refresh.

## What Changes

- Add a long-lived MCP access token model for Agent access to `/api/mcp`.
- Generate MCP credentials from the dashboard with a long validity period suitable for private deployments.
- Validate `Authorization: Bearer <token>` on the MCP route using token verification instead of browser session lookup.
- Sync the guide-only Skill instructions with MCP authentication behavior so assistants know how to handle missing, expired, or rotated MCP credentials.
- Preserve browser session authentication for the dashboard and existing application routes.
- Document token lifetime, rotation expectations, and the security tradeoff of long-lived local credentials.
- Add tests proving valid long-lived tokens authorize MCP requests and expired or invalid tokens are rejected.

## Capabilities

### New Capabilities
- `mcp-access-token`: Long-lived Bearer token authentication for the Next.js-hosted MCP endpoint.

### Modified Capabilities
- `mcp-tools`: MCP HTTP transport requires valid Bearer token authentication before serving tools.
- `nextjs-electricity-dashboard`: Dashboard exposes MCP credentials with clear lifetime and rotation behavior.
- `skill-package`: Skill instructions stay aligned with MCP tool availability, authentication failure behavior, and credential handling boundaries.

## Impact

- Affected code: `lib/auth.ts`, `app/api/mcp/route.ts`, dashboard credential UI, auth/MCP route tests, Skill guide text, and README or deployment documentation.
- Affected APIs: `/api/auth/token` token issuance behavior and `/api/mcp` Bearer authentication.
- Security impact: tokens become longer-lived secrets and must be treated like API keys; invalid, missing, expired, or malformed Bearer tokens must fail closed with `401`.
- No new external service dependency is required.
