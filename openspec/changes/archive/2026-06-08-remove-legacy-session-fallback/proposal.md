## Why

The project has migrated local credentials to `.csg/profiles.json` plus profile session files, so automatically discovering loose `session.json` files is no longer needed. Removing that fallback makes runtime credential selection deterministic and avoids accidentally using stale credentials from a working directory or bundled script folder.

## What Changes

- **BREAKING**: Remove implicit discovery of legacy `session.json` files from the current working directory, runtime module directory, and Skill script directory.
- Keep explicit one-off session loading through `--session` and `CSG_SESSION_FILE`.
- Keep registry-based profile discovery through `.csg/profiles.json`.
- Update documentation and generated MCP/Skill bundles so runtime behavior matches the source.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `skill-package`: Skill runtime session lookup no longer falls back to implicit `session.json` files.
- `multi-user-profiles`: Profile resolution no longer reports implicit legacy-session profiles.

## Impact

- Affected source: `src/profile.ts`, `src/cli.ts`, and generated runtime bundles.
- Affected documentation: `README.md` and Skill instructions.
- Users with only a loose `session.json` must migrate it into `.csg/profiles.json` or pass it explicitly with `--session` / `CSG_SESSION_FILE`.
