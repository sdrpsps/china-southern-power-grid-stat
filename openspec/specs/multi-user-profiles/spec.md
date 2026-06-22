# multi-user-profiles Specification

## Purpose
TBD - created by archiving change standardize-mcp-skill-packaging. Update Purpose after archive.
## Requirements
### Requirement: 本地用户配置注册表
项目 SHALL 支持多个本地用户配置，每个用户配置将稳定别名映射到一个本地保存的南方电网会话。

#### Scenario: 用户配置注册表存在
- **WHEN** 系统配置了多个用户
- **THEN** 系统在本地注册表中存储用户配置元数据
- **AND** 每个用户配置包含唯一别名、显示标签、会话路径以及创建或更新时间
- **AND** 序列化会话令牌存储在会话文件中，而不是直接输出到对话

#### Scenario: 部署产物查找用户配置注册表
- **WHEN** 已部署 MCP 或 Skill 产物运行，且未显式设置用户配置注册表环境变量
- **THEN** 系统优先查找运行文件同级 `.csg/profiles.json`
- **AND** 源码开发运行时优先使用项目根目录 `.csg/profiles.json`

#### Scenario: 忽略隐式旧版会话文件
- **WHEN** 不存在用户配置注册表
- **AND** 当前工作目录、运行文件同级目录或运行文件上级目录存在 loose `session.json`
- **THEN** 系统不得自动创建 `legacy-session` 用户配置
- **AND** 未显式指定会话路径的调用返回无可用会话错误

#### Scenario: 用户配置别名重复
- **WHEN** 用户尝试创建或重命名到已被其他用户配置使用的别名
- **THEN** 系统拒绝该变更
- **AND** 错误说明用户配置别名必须唯一

### Requirement: 默认用户配置选择
项目 SHALL 支持可配置默认用户配置，供未显式指定用户配置的调用方使用。

#### Scenario: 已配置默认用户配置
- **WHEN** 查询命令或 MCP 工具调用未带用户配置参数
- **THEN** 系统使用已配置的默认用户配置
- **AND** 结果标识实际使用的用户配置

#### Scenario: 缺少默认用户配置
- **WHEN** 查询命令或 MCP 工具调用未带用户配置参数，且不存在默认用户配置
- **THEN** 系统返回可操作错误
- **AND** 错误提示调用方列出用户配置或显式指定用户配置

### Requirement: 用户配置感知账户发现
项目 SHALL 允许调用方发现单个用户配置或所有已配置用户配置下的账户。

#### Scenario: 列出单个用户配置账户
- **WHEN** 调用方请求指定用户配置的账户
- **THEN** 系统只返回绑定到该用户配置会话的账户
- **AND** 每个账户结果包含用户配置别名

#### Scenario: 列出所有用户配置账户
- **WHEN** 调用方请求所有用户配置下的账户
- **THEN** 系统查询每个可用用户配置
- **AND** 系统按用户配置别名分组或标记返回账户
- **AND** 验证失败的用户配置单独报告，不阻塞成功用户配置的结果

### Requirement: 用户配置感知电表查询
项目 SHALL 支持在所选用户配置下查询单个电表、多个电表或所有已知电表的余额和用量，并 SHALL 将账户发现返回的 `accountNumber` 视为该用户配置下有效的缴费户号标识。

#### Scenario: 查询单个用户配置的单个电表
- **WHEN** 调用方提供用户配置别名和该用户配置账户列表返回的缴费户号
- **THEN** 系统只使用所选用户配置会话查询该电表
- **AND** 结果包含用户配置别名和户号

#### Scenario: 查询单个用户配置的 15 位电表户号
- **WHEN** 调用方提供用户配置别名和该用户配置账户列表返回的 15 位数字缴费户号
- **THEN** 系统接受该户号
- **AND** 系统不得因户号不是 16 位而拒绝查询

#### Scenario: 查询单个用户配置的多个电表
- **WHEN** 调用方提供用户配置别名和多个缴费户号
- **THEN** 系统查询该用户配置下每个请求电表
- **AND** 结果包含逐电表成功或错误条目

#### Scenario: 查询所有用户配置下所有电表
- **WHEN** 调用方请求所有用户配置下的所有电表
- **THEN** 系统为每个可用用户配置发现账户
- **AND** 系统查询每个已发现电表
- **AND** 结果包含逐用户配置、逐电表条目，使部分失败可见

#### Scenario: 计量点编号不作为缴费户号匹配
- **WHEN** 调用方提供只匹配 `meteringPointNumber`、但不匹配任何已发现 `accountNumber` 的值
- **THEN** 系统拒绝该选择
- **AND** 错误提示该户号未绑定到所选用户配置

### Requirement: 用户配置感知登录
项目 SHALL 允许登录流程创建或更新命名用户配置。

#### Scenario: 登录创建用户配置
- **WHEN** 用户使用新用户配置别名完成登录
- **THEN** 系统在本地写入新会话
- **AND** 系统在本地用户配置注册表中记录用户配置别名和会话路径

#### Scenario: 登录更新用户配置
- **WHEN** 用户针对已有用户配置别名完成登录并确认替换
- **THEN** 系统替换或更新该用户配置的会话文件
- **AND** 使用该用户配置别名的查询会使用新会话

### Requirement: 多用户隐私
项目 SHALL 在展示多用户结果时，将用户配置别名、户号、地址和用户名视为敏感信息。

#### Scenario: 助手总结多用户结果
- **WHEN** 助手报告多个用户配置的查询结果
- **THEN** 使用别名或显示标签标识用户配置
- **AND** 除非用户明确要求完整详情，否则遮蔽完整户号、地址和用户名

### Requirement: Web-managed user profiles
The system SHALL manage multiple user profiles through the Next.js Web application backed by SQLite.

#### Scenario: Profile list is displayed
- **WHEN** the user opens the profile area in the dashboard
- **THEN** the system lists stored profiles with alias, optional label, default indicator, session status, and timestamps
- **AND** raw session tokens are not displayed

#### Scenario: Profile is selected
- **WHEN** the user selects a profile in the dashboard
- **THEN** subsequent account, balance, usage, and verification operations use that profile unless the user chooses all profiles or another profile
- **AND** results identify the profile used for each record

#### Scenario: Profile alias is invalid
- **WHEN** the user submits a profile alias that does not satisfy alias validation rules
- **THEN** the system rejects the profile change
- **AND** the dashboard displays a validation error without writing the invalid profile

### Requirement: Web all-profiles operations
The system SHALL support all-profiles account discovery, balance lookup, usage lookup, and session verification from the Web app.

#### Scenario: Accounts are listed for all profiles
- **WHEN** the user requests account discovery across all profiles
- **THEN** the system queries each profile independently
- **AND** the dashboard displays successful account records and per-profile errors

#### Scenario: Balances are queried for all profiles
- **WHEN** the user requests balances for all accounts across all profiles
- **THEN** the system queries each available profile and account independently
- **AND** the dashboard displays per-profile, per-account success and error records

#### Scenario: Sessions are verified for all profiles
- **WHEN** the user requests verification across all profiles
- **THEN** the system reports validity for each profile independently
- **AND** a failed profile does not hide successful verification results from other profiles

### Requirement: Profile creation from Web login
The system SHALL create or update SQLite-backed profiles from successful Web login flows.

#### Scenario: SMS login creates a profile
- **WHEN** the user completes SMS or password-plus-SMS login with a valid profile alias
- **THEN** the system creates or updates a SQLite-backed profile without writing new files under `cli-src`
- **AND** the stored profile is associated with the verified server-side session

#### Scenario: QR login creates a profile
- **WHEN** the user completes QR login with a valid profile alias
- **THEN** the system creates or updates a SQLite-backed profile without writing new files under `cli-src`
- **AND** the stored profile is associated with the verified server-side session

