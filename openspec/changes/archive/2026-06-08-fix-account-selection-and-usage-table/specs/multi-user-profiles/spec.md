## MODIFIED Requirements

### Requirement: 用户配置感知电表查询
项目 SHALL 支持在所选用户配置下查询单个电表、多个电表或所有已知电表的余额和用量，并 SHALL treat discovered `accountNumber` values as the valid payment account identifiers for that profile.

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
