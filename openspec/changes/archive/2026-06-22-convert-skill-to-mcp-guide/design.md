## Context

The project currently exposes the same Southern Power Grid data access through two local AI entry points: a structured MCP server and a Skill package with a bundled `scripts/cli.cjs` command. That made sense while the Skill needed a deterministic local execution path, but it now duplicates responsibilities that already belong to the MCP server and the user's agent MCP configuration.

The target Skill ecosystem treats skills as assistant guidance: when to use a capability, what tools to expect, what parameters are safe, and how to render the answer. The user's agent is still responsible for configuring the MCP service endpoint or stdio command. The Skill package should therefore be installable without local paths, service addresses, credentials, or executable data-access code.

## Goals / Non-Goals

**Goals:**

- Make the Skill package a guide-only artifact containing `SKILL.md`.
- Require the guide to depend on a preconfigured MCP service named `china-southern-power-grid`.
- Document expected MCP tools and missing-MCP behavior in `SKILL.md`.
- Preserve assistant rules for profile selection, account discovery, account-number use, privacy, and monthly usage answers.
- Require monthly electricity usage/cost details to be rendered as Markdown tables.
- Remove Skill build, generated Skill CLI output, and local credential packaging from the Skill contract.

**Non-Goals:**

- Do not change MCP tool names, schemas, or server behavior.
- Do not add install-time MCP URL templating or Skill-local MCP configuration.
- Do not move credentials into the Skill package.
- Do not remove the project MCP build, login flow, or query-service internals unless they become unused by implementation after the Skill CLI is removed.

## Decisions

1. **Skill depends on a named MCP service instead of an address**

   The guide will name `china-southern-power-grid` as the expected MCP service and list the tools it needs. It will not include a URL, stdio command, generated config file, or installation prompt for MCP connection details.

   Alternative considered: let Skill installation accept an MCP URL. This couples a portable guide to local machine state, conflicts with users needing to configure MCP in their agent anyway, and risks overwriting user-specific settings on Skill updates.

2. **Remove the bundled Skill execution script and build step**

   The Skill package will no longer include `scripts/cli.cjs`, and the project will no longer expose a `build:skill` step because the Skill is a static `SKILL.md` guide. Data access should go through MCP tools exposed by the agent.

   Alternative considered: keep `cli.cjs` as fallback. That preserves two data-access surfaces, keeps credentials and path lookup rules in the Skill package, and makes assistant behavior less predictable because it can choose between MCP and shell execution.

3. **Convert CLI-oriented guidance into MCP-oriented guidance**

   Existing rules for profiles, all profiles, account discovery, `accountNumber`, `meteringPointNumber`, and privacy remain valuable, but they should be expressed as MCP tool usage rules rather than shell command examples.

   Alternative considered: delete all CLI-related requirements without replacement. That would make the package simpler but lose important domain behavior that prevents wrong户号 use and privacy leaks.

4. **Render monthly details as tables**

   Monthly usage/cost answers should present daily entries in Markdown tables with at least date, usage, and fee/cost columns. When the upstream data does not provide daily cost despite a non-zero monthly total, the guide must tell the assistant to say that daily cost details are unavailable instead of estimating.

   Alternative considered: leave answer format to the assistant. That gives inconsistent user output and weakens the core value of the Skill guide.

## Risks / Trade-offs

- Missing MCP service becomes a user-visible blocker -> Mitigate by making `SKILL.md` explicitly tell the assistant to report the missing `china-southern-power-grid` MCP configuration instead of guessing paths or running local commands.
- Existing users of `node ./scripts/cli.cjs` through the Skill package lose that path -> Mitigate by documenting this as a breaking change and keeping MCP/server usage in README.
- Removing Skill build output may leave stale generated files in existing checkouts -> Mitigate implementation with cleanup tasks and docs/tests that assert the package contains only guide files.
- MCP tool names changing later would break the guide -> Mitigate by treating tool names as part of the MCP contract and updating the Skill guide in the same change as any future MCP rename.
