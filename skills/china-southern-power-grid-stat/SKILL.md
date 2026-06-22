---
name: china-southern-power-grid-stat
description: 查询南方电网多用户配置下的电费余额、欠费状况及月度每日用电详情。
version: 1.1.0
---

# 南方电网电费与用电数据查询

使用已配置的 `china-southern-power-grid` MCP 服务查询本地已登录用户配置下的电表账户、余额、欠费和月度每日用电详情。本 Skill 只提供助手指引，不负责启动、安装或配置 MCP 服务。

## MCP 依赖

需要当前 agent 已配置名为 `china-southern-power-grid` 的 MCP 服务，并提供这些工具：

- `list_profiles`：列出本地用户配置。
- `get_electricity_accounts`：列出指定用户配置或所有用户配置的电表账户。
- `get_balance`：查询一个或多个缴费户号的余额和欠费。
- `get_usage`：查询一个或多个缴费户号的月度每日用电详情。
- `verify_session`：验证指定用户配置或所有用户配置的登录状态。

如果需要查询南方电网数据但 MCP 服务或所需工具不可用，提示用户先在当前 agent 中配置 `china-southern-power-grid` MCP 服务。不要猜测本地脚本路径、MCP 地址、启动命令、会话文件位置或凭证目录。

## 用户配置

- 用户明确指定配置别名时，使用 MCP 工具的 `profile` 参数。
- 用户请求查询所有配置时，使用 MCP 工具的 `allProfiles` 参数。
- 用户没有指定配置时，使用 MCP 服务默认用户配置。
- 如果 MCP 工具报告没有默认用户配置，先使用 `list_profiles` 查看可用项，或引导用户配置默认用户配置。

## 查询流程

### 列出电表账户

查询余额或用量前，如果用户没有给出缴费户号，先调用 `get_electricity_accounts`。如果电表账户列表只有一个明确匹配项，可以直接使用该账户的 `accountNumber` 查询；多个电表账户或匹配不明确时，让用户确认要查哪个用户配置和户号。

### 查询余额与欠费

调用 `get_balance`。缴费户号必须使用电表账户列表返回的 `accountNumber`，可用 `accountNumber` 或 `accountNumbers` 查询一个或多个户号，也可结合 `allAccounts` 查询选中用户配置下所有电表。

不要把 `meteringPointNumber` 当作缴费户号重试。不要因为 `accountNumber` 不是固定 16 位而拒绝查询；南方电网电表账户列表可能返回 15 位或其他长度的数字缴费户号。

### 查询月度每日用电详情

调用 `get_usage`。必须提供年份和月份，并使用电表账户列表返回的 `accountNumber`，或结合 `allAccounts` 查询选中用户配置下所有电表。不要把 `meteringPointNumber` 当作缴费户号重试。

### 验证登录状态

调用 `verify_session` 验证指定用户配置或所有用户配置的登录状态。遇到用户配置或会话错误时，引导用户在 MCP 服务部署环境中运行登录流程生成或更新用户配置。

## 输出处理

- 单用户配置、单户号查询通常可以汇总为简短自然语言。
- 多用户配置、多户号或部分失败时，分用户配置和户号说明成功结果与失败项，不隐藏成功结果。
- 回答余额和欠费时可以展示金额摘要；除非用户明确要求，不展示完整户号、完整地址、完整用户名或会话内容。
- 回答月度每日用电详情或月电费详情时，把 `dailyDetails` 展示为 Markdown 表格，至少包含日期、用电量（度/kWh）和用电额/电费（元）。
- 如果每日 `charge` 均为 0 或缺失，但 `monthTotalCost` 不为 0，说明上游未返回可用的每日电费明细，不要自行分摊估算。
- 如果用户提供非数字缴费户号，说明缴费户号必须是数字字符串；在没有电表账户列表确认前不要把该值传给余额或用量工具。
