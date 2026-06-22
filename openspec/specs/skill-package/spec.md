# skill-package Specification

## Purpose

Define the guide-only Skill package contract for assistant-facing Southern Power Grid usage instructions.

## Requirements

### Requirement: 可携带 Skill 包结构
Skill 包 SHALL 是一个可携带目录，只包含面向助手的 MCP 使用指引，不包含本地数据访问脚本、MCP 地址、本地会话凭证或用户机器特定配置。

#### Scenario: 构建 Skill 包
- **WHEN** Skill 构建命令成功完成
- **THEN** Skill 目录包含 `SKILL.md`
- **AND** Skill 目录不包含 `scripts/cli.cjs`
- **AND** Skill 目录不包含 `session.json`
- **AND** Skill 目录不包含 `scripts/.csg/`
- **AND** Skill 指引不包含固定 MCP URL、固定 stdio 命令或本机绝对路径

### Requirement: Skill 用户配置选择
Skill 指引 SHALL 说明助手通过已配置 MCP 服务的工具参数选择命名用户配置、默认用户配置或全部已配置用户配置。

#### Scenario: 提供用户配置参数
- **WHEN** 用户明确指定用户配置别名
- **THEN** 助手使用 MCP 工具的 `profile` 参数查询该用户配置
- **AND** 回答中的结果条目保留用户配置别名，但不得泄露会话内容

#### Scenario: 请求所有用户配置
- **WHEN** 用户请求查询所有用户配置
- **THEN** 助手使用 MCP 工具的 `allProfiles` 参数查询所有已配置用户配置
- **AND** 助手逐用户配置说明失败项，不隐藏成功用户配置的结果

#### Scenario: 未指定用户配置
- **WHEN** 用户没有指定用户配置
- **THEN** 助手使用 MCP 服务默认用户配置
- **AND** 如果 MCP 工具报告没有默认用户配置，助手引导用户先查看或配置可用用户配置

### Requirement: 面向助手的 Skill 指引
Skill 的 `SKILL.md` SHALL 是精简的 MCP 使用指引，而不是普通项目 README 或本地命令手册。

#### Scenario: 助手读取 Skill 指引
- **WHEN** 助手加载 Skill
- **THEN** 指引说明本 Skill 依赖名为 `china-southern-power-grid` 的已配置 MCP 服务
- **AND** 指引列出期望可用的 MCP 工具：`list_profiles`、`get_electricity_accounts`、`get_balance`、`get_usage` 和 `verify_session`
- **AND** 指引说明如何通过 MCP 工具选择用户配置或查询所有用户配置
- **AND** 指引说明何时需要先列出账户，再查询账户相关数据
- **AND** 指引说明账户列表返回单个明确匹配账户时可直接使用该账户的 `accountNumber` 查询
- **AND** 指引说明 `accountNumber` 是余额和用量查询参数，`meteringPointNumber` 不得当作缴费户号重试
- **AND** 指引提醒助手不要泄露完整户号、地址或会话内容，除非用户明确要求

#### Scenario: MCP 服务不可用
- **WHEN** 助手需要查询南方电网数据但当前环境没有可用的 `china-southern-power-grid` MCP 服务或所需工具
- **THEN** 助手提示用户先在当前 agent 中配置该 MCP 服务
- **AND** 助手不得猜测本地脚本路径、MCP 地址或会话文件位置

#### Scenario: 助手总结每日用电详情
- **WHEN** 助手基于 MCP 用量工具结果回答月度每日用电详情或月电费详情
- **THEN** 回答使用 Markdown 表格展示每日明细
- **AND** 表格至少包含日期、用电量、用电额或电费列
- **AND** 如果每日电费均为 0 或缺失但月总电费不为 0，回答说明每日电费明细不可用或上游未返回，不得自行分摊估算

### Requirement: Skill 缴费户号选择
Skill 指引 SHALL 要求助手使用账户发现返回的数字缴费户号，并依赖 MCP 服务基于所选用户配置下已绑定账户校验所选户号。

#### Scenario: 查询发现返回的 15 位户号
- **WHEN** 助手使用账户列表返回的 15 位数字 `accountNumber` 调用余额或用量 MCP 工具
- **THEN** Skill 指引允许该查询继续
- **AND** 助手不得因为户号不是固定 16 位而拒绝查询

#### Scenario: 查询未绑定的数字户号
- **WHEN** 助手使用当前用户配置未绑定的数字户号调用余额或用量 MCP 工具
- **THEN** 助手基于 MCP 工具错误向用户说明该户号未绑定到所选用户配置
- **AND** 助手不得改用 `meteringPointNumber` 或猜测其他户号重试

#### Scenario: 查询非数字户号
- **WHEN** 用户提供包含非数字字符的户号
- **THEN** 助手说明缴费户号必须是数字字符串
- **AND** 助手在没有账户列表确认前不得把该值传给余额或用量 MCP 工具

### Requirement: 拆分构建和打包命令
项目 SHALL 将 MCP 服务构建和 guide-only Skill 静态文档维护分离，并 SHALL 不再提供 Skill 构建脚本或会把本地凭证复制进 Skill 包的本地专用 Skill 打包路径。

#### Scenario: 运行普通构建
- **WHEN** 运行普通项目构建命令
- **THEN** 可以生成 MCP 服务代码产物
- **AND** 普通构建不得生成 `skills/china-southern-power-grid-stat/scripts/cli.cjs`
- **AND** 普通构建不得调用或要求 `build:skill`
- **AND** 本地会话凭证不会复制到 Skill 目录

#### Scenario: 请求本地 Skill 凭证打包
- **WHEN** 用户尝试使用旧的本地专用 Skill 凭证打包命令或流程
- **THEN** 项目不再复制 `.csg/` 到 Skill 目录
- **AND** 文档引导用户在 agent MCP 配置和 MCP 服务部署位置管理凭证
