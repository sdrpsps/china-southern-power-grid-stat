## ADDED Requirements

### Requirement: Skill MCP authentication guidance
Skill instructions SHALL describe MCP authentication failures in terms of agent MCP configuration, without exposing or requesting raw secrets in conversation.

#### Scenario: MCP reports unauthorized
- **WHEN** the assistant using the Skill receives an MCP connection or tool error indicating missing, invalid, expired, or unauthorized credentials
- **THEN** the Skill guidance directs the assistant to tell the user to update the configured `Authorization: Bearer <token>` for the `china-southern-power-grid` MCP service
- **AND** the assistant does not ask the user to paste the full token into chat
- **AND** the assistant does not attempt to read local browser cookies or session files as a workaround

#### Scenario: User asks how to configure agent access
- **WHEN** the user asks how to connect an agent to the Skill-backed MCP service
- **THEN** the Skill guidance explains that the agent must use the already configured `china-southern-power-grid` MCP service
- **AND** the guidance references the long-lived MCP Bearer token as an agent configuration secret
- **AND** the guidance does not embed a fixed MCP URL, fixed token, local absolute path, or local startup command

### Requirement: Skill MCP tool surface alignment
Skill instructions SHALL stay aligned with the MCP service's supported tool names and tool-selection behavior.

#### Scenario: Skill lists MCP tools
- **WHEN** the Skill guide lists required MCP tools
- **THEN** it lists the MCP tools currently provided by the service: `list_profiles`, `get_electricity_accounts`, `get_balance`, `get_usage`, and `verify_session`
- **AND** it does not describe removed local CLI commands as callable Skill capabilities

#### Scenario: MCP tool unavailable
- **WHEN** a required MCP tool is unavailable in the current agent environment
- **THEN** the Skill guidance directs the assistant to report that the MCP service configuration is incomplete or stale
- **AND** the assistant does not guess alternate local scripts, credential directories, or undocumented tool names
