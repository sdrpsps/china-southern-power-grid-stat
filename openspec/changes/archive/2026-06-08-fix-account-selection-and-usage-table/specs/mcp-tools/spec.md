## MODIFIED Requirements

### Requirement: MCP 输入校验
MCP 服务 SHALL 在调用南方电网上游账户相关接口前校验工具参数，并 SHALL accept numeric payment account identifiers that can be returned by account discovery rather than assuming a fixed 16-digit length.

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
