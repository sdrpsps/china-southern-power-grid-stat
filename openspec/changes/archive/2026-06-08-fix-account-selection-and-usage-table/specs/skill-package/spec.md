## MODIFIED Requirements

### Requirement: 面向助手的 Skill 指引
Skill 的 `SKILL.md` SHALL 是精简的助手指引，而不是普通项目 README。

#### Scenario: 助手读取 Skill 指引
- **WHEN** 助手加载 Skill
- **THEN** 指引告诉助手分别用哪些命令查询账户、余额、用量和会话状态
- **AND** 指引说明如何选择用户配置或查询所有用户配置
- **AND** 指引说明何时需要先列出账户，再查询账户相关数据
- **AND** 指引说明账户列表返回单个明确匹配账户时可直接使用该账户的 `accountNumber` 查询
- **AND** 指引说明 `accountNumber` 是余额和用量查询参数，`meteringPointNumber` 不得当作缴费户号重试
- **AND** 指引提醒助手不要泄露完整户号、地址或会话内容，除非用户明确要求

#### Scenario: 助手总结每日用电详情
- **WHEN** 助手基于用量命令结果回答月度每日用电详情
- **THEN** 回答使用 Markdown 表格展示每日明细
- **AND** 表格至少包含日期、用电量、用电额或电费列
- **AND** 如果每日电费均为 0 或缺失但月总电费不为 0，回答说明每日电费明细不可用或上游未返回，不得自行分摊估算

## ADDED Requirements

### Requirement: Skill 缴费户号选择
Skill 命令行 SHALL accept numeric payment account identifiers returned by account discovery and SHALL validate selected accounts against the accounts bound to the selected profile.

#### Scenario: 查询发现返回的 15 位户号
- **WHEN** 助手使用账户列表返回的 15 位数字 `accountNumber` 调用余额或用量命令
- **THEN** 命令接受该户号并继续查询
- **AND** 命令不得返回固定 16 位长度校验错误

#### Scenario: 查询未绑定的数字户号
- **WHEN** 助手使用当前用户配置未绑定的数字户号调用余额或用量命令
- **THEN** 命令以非零状态退出或在批量结果中记录该户号错误
- **AND** 错误提示该户号未绑定到所选用户配置

#### Scenario: 查询非数字户号
- **WHEN** 助手使用包含非数字字符的户号调用余额或用量命令
- **THEN** 命令返回 JSON 错误
- **AND** 错误说明缴费户号必须是数字字符串
