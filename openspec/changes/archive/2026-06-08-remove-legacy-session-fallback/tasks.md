## 1. Implementation

- [x] Remove implicit legacy `session.json` discovery from profile resolution.
- [x] Update README and Skill instructions to document supported session lookup only.
- [x] Rebuild generated MCP and Skill bundles.

## 2. Verification

- [x] Run type checking.
- [x] Verify profile listing still reads `.csg/profiles.json`.
- [x] Verify a loose `session.json` is ignored when no registry or explicit session path is available.
- [x] Validate the OpenSpec change.
