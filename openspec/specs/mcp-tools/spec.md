# mcp-tools Specification

## Purpose
TBD - created by archiving change standardize-mcp-skill-packaging. Update Purpose after archive.
## Requirements
### Requirement: MCP 零依赖部署产物
MCP 服务 SHALL 构建为可复制部署的单文件 Node.js 产物，部署时不要求安装 npm 依赖。

#### Scenario: 构建 MCP 单文件
- **WHEN** MCP 构建命令成功完成
- **THEN** `mcp/` 目录包含 `server.cjs`
- **AND** `server.cjs` 包含运行 MCP 服务所需的协议、结构校验和项目查询逻辑
- **AND** 部署该服务不需要复制 `node_modules` 或 `package.json`

#### Scenario: MCP 同级凭证目录
- **WHEN** 部署后的 MCP 服务启动，且未显式设置用户配置注册表环境变量
- **THEN** 服务优先读取 `server.cjs` 同级 `.csg/profiles.json`
- **AND** `profiles.json` 中的相对会话路径相对于该 `.csg/` 目录解析

#### Scenario: MCP 构建保留本地凭证
- **WHEN** MCP 构建命令清理并重新生成代码产物
- **THEN** 构建不得删除 `mcp/.csg/` 下的本地凭证目录

### Requirement: 结构化 MCP 工具定义
MCP 服务 SHALL 以明确的输入结构、输出结构、人类可读描述和只读标注暴露电费查询工具。

#### Scenario: 客户端列出工具
- **WHEN** MCP 客户端请求可用工具
- **THEN** 服务返回列出用户配置、列出账户、查询余额、查询用量和验证会话的工具定义
- **AND** 每个查询工具包含输入结构和输出结构
- **AND** 每个工具标注为只读且非破坏性

### Requirement: 结构化 MCP 工具结果
MCP 服务 SHALL 在成功工具调用中通过 `structuredContent` 返回机器可读查询数据，同时保留适合人类阅读摘要或紧凑 JSON 文本的 `content`。

#### Scenario: 账户列表成功
- **WHEN** 客户端使用有效用户配置或所有用户配置选择器调用账户列表工具
- **THEN** 结果包含带 `accounts` 数组的 `structuredContent`
- **AND** 每个账户包含用户配置别名、缴费户号、地区代码、用电客户编号、计量点标识、地址和用户名字段
- **AND** `isError` 缺省或为 false

#### Scenario: 余额查询成功
- **WHEN** 客户端使用已知用户配置和缴费户号调用余额工具
- **THEN** 结果包含带用户配置别名、户号、地址、用户名、余额和欠费的 `structuredContent`
- **AND** 金额字段以数字形式返回，单位为元
- **AND** `isError` 缺省或为 false

#### Scenario: 用量查询成功
- **WHEN** 客户端使用已知用户配置、缴费户号、年份和月份调用用量工具
- **THEN** 结果包含带用户配置别名、月度合计、阶梯信息和每日明细行的 `structuredContent`
- **AND** 每日明细行包含日期、电费和千瓦时值
- **AND** `isError` 缺省或为 false

### Requirement: MCP 输入校验
MCP 服务 SHALL 在调用南方电网上游账户相关接口前校验工具参数，并 SHALL 接受账户发现可能返回的数字缴费户号，而不是假定固定 16 位长度。

#### Scenario: 无效户号
- **WHEN** 客户端调用需要户号的工具，且值缺失、包含非数字字符或超出支持的缴费户号长度范围
- **THEN** 服务返回 `isError` 为 true 的工具结果
- **AND** 错误信息说明无效参数，并且不调用账户相关远程接口

#### Scenario: 发现返回的 15 位户号
- **WHEN** 客户端使用账户列表返回的 15 位数字 `accountNumber` 调用余额或用量工具
- **THEN** 服务接受该户号作为有效参数
- **AND** 服务按该用户配置下绑定的缴费账户继续查询

#### Scenario: 计量点编号不是缴费户号
- **WHEN** 客户端使用只存在于 `meteringPointNumber` 字段、但未作为 `accountNumber` 绑定的值调用余额或用量工具
- **THEN** 服务返回 `isError` 为 true 的工具结果
- **AND** 错误信息提示调用方先列出账户并使用返回的 `accountNumber`

#### Scenario: 无效月份
- **WHEN** 客户端调用用量工具，且月份不在 1 到 12 之间
- **THEN** 服务返回 `isError` 为 true 的工具结果
- **AND** 错误信息说明有效月份范围，并且不调用远程接口

#### Scenario: 无效用户配置别名
- **WHEN** 客户端调用用户配置感知工具，且传入未知用户配置别名
- **THEN** 服务返回 `isError` 为 true 的工具结果
- **AND** 错误信息提示调用方先列出用户配置

### Requirement: MCP 批量电表查询
MCP 服务 SHALL 通过结构化批量输入支持查询多个电表，并返回逐电表结果条目。

#### Scenario: 余额批量查询部分成功
- **WHEN** 客户端使用多个所选电表调用余额工具，且其中一个电表无法查询
- **THEN** 结果包含成功查询电表的成功条目
- **AND** 结果包含失败电表的错误条目
- **AND** 整体结果仍可在 `structuredContent` 中检查

### Requirement: MCP 工具错误行为
MCP 服务 SHALL 将领域错误和凭证错误作为 `isError` 为 true 的 MCP 工具结果报告，仅将协议级错误保留给不支持的方法或传输失败。

#### Scenario: 缺少会话
- **WHEN** 调用查询工具且没有可用会话文件
- **THEN** 结果包含 `isError` 为 true
- **AND** 消息说明调用方如何生成或配置会话

#### Scenario: 未找到账户
- **WHEN** 余额或用量查询引用了当前会话未绑定的缴费户号
- **THEN** 结果包含 `isError` 为 true
- **AND** 消息提示调用方先列出账户

### Requirement: MCP 会话验证
MCP 服务 SHALL 提供会话验证能力，可验证一个已配置用户配置或所有已配置用户配置，且不需要户号。

#### Scenario: 会话有效
- **WHEN** 客户端针对某个用户配置调用会话验证工具，且保存的会话被上游接口接受
- **THEN** 结果包含带用户配置别名和 `valid: true` 的 `structuredContent`
- **AND** `isError` 缺省或为 false

#### Scenario: 会话无效
- **WHEN** 客户端针对某个用户配置调用会话验证工具，且保存的会话缺失、过期、格式损坏或被拒绝
- **THEN** 结果包含带用户配置别名、`valid: false` 和原因代码的 `structuredContent`
- **AND** `isError` 为 true
