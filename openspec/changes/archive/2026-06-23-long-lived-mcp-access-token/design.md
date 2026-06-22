## Context

The current dashboard exposes an MCP credential by calling `authClient.token()`, which maps to the Better Auth JWT plugin default. The default JWT lifetime is 15 minutes. The MCP HTTP route then calls `auth.api.getSession()` with request headers, which authorizes browser cookies but does not treat a Better Auth JWT in `Authorization: Bearer` as a browser session.

This creates two failure modes for agents: copied tokens expire quickly, and Bearer JWT authentication does not match the route's current session lookup. The MCP endpoint protects sensitive local electricity profile data, so the fix must fail closed while making private agent configuration stable.

## Goals / Non-Goals

**Goals:**
- Provide a long-lived token suitable for configuring local or private MCP clients.
- Make `/api/mcp` authenticate `Authorization: Bearer <token>` by verifying the token itself.
- Keep normal dashboard authentication and browser sessions unchanged.
- Make token lifetime visible in code and user-facing MCP credential guidance.
- Keep the guide-only Skill instructions aligned with the MCP authentication model and available tool surface.
- Cover valid, expired, malformed, and missing token cases with tests.

**Non-Goals:**
- Do not implement OAuth authorization flows for MCP clients in this change.
- Do not store or display Southern Power Grid upstream session tokens in agent configuration.
- Do not make MCP access public or unauthenticated.
- Do not turn the Skill package back into an executable local data-access bundle.
- Do not introduce multi-token management, named API keys, or revocation UI unless needed for safe minimal rotation.

## Decisions

1. Use Better Auth JWTs as the MCP access token format, with explicit long-lived MCP settings.

   The existing auth stack already has signing keys, JWKS persistence, and verification helpers. Keeping JWTs avoids adding a second credential table for this change. The implementation should configure the JWT plugin with an explicit `expirationTime` for MCP credentials, or use `auth.api.signJWT()` with MCP-specific override options if a different lifetime is needed from other JWT usage.

   Alternative considered: opaque API keys stored in SQLite. That would give straightforward revocation and no embedded expiration, but it requires a new data model and UI workflows. It is better suited for a later token-management enhancement.

2. Treat MCP Bearer token validation as distinct from browser session validation.

   `/api/mcp` should parse the `Authorization` header, require the `Bearer` scheme, call `auth.api.verifyJWT()`, and accept only a valid payload. It should not rely on `auth.api.getSession()` for MCP Bearer access because that API authorizes browser session cookies, not JWT Bearer credentials.

   Alternative considered: add Better Auth's `bearer()` plugin. That plugin converts Bearer session tokens to session cookies, but the dashboard currently copies a JWT, not the signed session token. Using direct JWT verification is clearer and matches the documented MCP configuration.

3. Scope accepted JWTs to MCP access.

   The token should carry an MCP-specific claim such as `token_use: "mcp"` or `scope: "mcp:access"`. `/api/mcp` should require that claim so a general-purpose JWT is not automatically treated as an MCP credential. The dashboard credential action should generate the MCP-scoped token.

   Alternative considered: accept any valid Better Auth JWT. That is simpler, but it makes token purpose ambiguous and increases blast radius if other JWTs are exposed later.

4. Prefer a long but finite lifetime over a literally non-expiring JWT.

   A long finite lifetime such as 365 days gives the user the practical "长期有效" behavior while retaining predictable expiration, library compatibility, and testable failure behavior. The chosen lifetime should be centralized in configuration and documented. If the user later needs truly no-expiration API keys, that should be an explicit opaque-token feature with revocation support.

   Alternative considered: omit `exp`. Non-expiring JWTs are harder to rotate safely and may not be accepted consistently by verification libraries or future policy checks.

5. Keep Skill guidance synchronized with MCP auth behavior, not with implementation internals.

   The Skill remains a portable guide that assumes an already configured `china-southern-power-grid` MCP service. It should list the current MCP tools and explain that authentication errors mean the user's agent MCP configuration needs a fresh long-lived Bearer token. It should not embed a token, fixed URL, local path, startup command, or browser session workaround.

   Alternative considered: include dashboard token-generation steps inside the Skill. That would make the Skill less portable and could encourage assistants to ask users to reveal secrets in chat. The Skill should instead direct users to configure the MCP service in their agent environment.

## Risks / Trade-offs

- Long-lived token leak grants MCP access for a long period -> Display the token only on explicit user action, document it as an API secret, and require HTTPS or local-only deployment guidance for remote setups.
- No per-token revocation with plain JWTs -> Keep the lifetime finite and document rotation by changing `BETTER_AUTH_SECRET` or JWKS/signing keys; consider opaque revocable API keys as a follow-up if needed.
- Existing copied tokens remain invalid after route behavior changes if they lack MCP scope -> The dashboard should generate fresh MCP-scoped tokens and documentation should tell users to replace old agent config tokens.
- Increasing global JWT lifetime could affect future JWT uses -> Prefer MCP-specific signing options if feasible; if the Better Auth plugin is globally configured, audit current JWT consumers and document the intentional scope.
- Skill documentation can drift from MCP behavior -> Update the Skill guide and Skill package spec in the same change, and include it in implementation review.

## Migration Plan

1. Add centralized MCP token configuration for lifetime, issuer/audience behavior, and required MCP scope claim.
2. Update the dashboard credential action to request or generate an MCP-scoped token with the long lifetime.
3. Update `/api/mcp` to validate Bearer JWTs directly and reject missing, malformed, expired, or non-MCP-scoped tokens with `401`.
4. Update README and in-app credential text to state the token lifetime and rotation guidance.
5. Update the guide-only Skill instructions to describe MCP auth failure handling and avoid stale short-token assumptions.
6. Add route-level tests for valid MCP token, expired token, missing token, malformed token, and valid non-MCP JWT rejection.
7. Rollback by restoring the previous route guard and JWT defaults; users would need to copy a fresh dashboard session credential again.

## Open Questions

- Should the default long lifetime be exactly 365 days, or should it be environment-configurable with 365 days as the default?
- Is a minimal "regenerate token" button enough for this change, or should revocation be deferred until an opaque API-key model is introduced?
