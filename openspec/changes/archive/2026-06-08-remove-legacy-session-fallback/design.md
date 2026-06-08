## Overview

Credential resolution should use two supported paths: configured profiles from `.csg/profiles.json`, or explicit single-session overrides. The legacy automatic scan for `session.json` creates ambiguity because the current working directory and generated script directory can differ across MCP, Skill, and development execution.

## Decisions

- Remove `findLegacySessionPath` and the fallback profile it creates.
- Retain `ProfileSelector.sessionPath` and `CSG_SESSION_FILE` as explicit overrides because callers intentionally provide those paths.
- Keep the profile registry path selection logic unchanged so deployed MCP and Skill builds still prefer their colocated `.csg/profiles.json`.
- Update docs to describe supported lookup only, without recommending implicit legacy discovery.

## Alternatives Considered

- Keep legacy discovery but lower its priority. This still risks silently loading stale credentials and does not match the current profile registry model.
- Remove all single-session paths. This would be stricter, but it would also remove useful explicit testing and recovery workflows.

## Risks

- Users who still rely on loose `session.json` files will see a missing-session error until they migrate to `.csg` profiles or pass `--session`.
- Generated bundles must be rebuilt after source changes so MCP and Skill behavior do not drift.
