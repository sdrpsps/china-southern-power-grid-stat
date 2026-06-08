# skill-package Specification

## Purpose
TBD - created by archiving change standardize-mcp-skill-packaging. Update Purpose after archive.
## Requirements
### Requirement: 可携带 Skill 包结构
Skill 包 SHALL 是一个可携带目录，只包含助手使用和确定性脚本执行所需文件。

#### Scenario: 构建 Skill 包
- **WHEN** Skill 构建命令成功完成
- **THEN** Skill 目录包含 `SKILL.md` 和 `scripts/cli.cjs`
- **AND** 除非本地凭证打包命令显式请求，否则 Skill 目录不包含 `session.json`
- **AND** 除非本地凭证打包命令显式请求，否则 `scripts/` 目录不包含 `.csg/`

### Requirement: Skill 运行时会话查找
Skill 命令行 SHALL 使用确定性规则定位会话文件，默认不依赖调用方当前工作目录。

#### Scenario: 提供显式会话路径
- **WHEN** 调用 Skill 命令行时提供显式会话路径参数
- **THEN** 命令行读取该会话文件
- **AND** 没有其他会话查找位置优先于该路径

#### Scenario: 提供环境变量会话路径
- **WHEN** 调用 Skill 命令行时未提供显式会话路径，但设置了会话路径环境变量
- **THEN** 命令行读取环境变量指定的会话文件

#### Scenario: 存在 Skill 同级用户配置
- **WHEN** 调用 Skill 命令行时未提供显式会话路径，也未设置环境变量会话路径，但 `cli.cjs` 同级存在 `.csg/profiles.json`
- **THEN** 命令行读取 `cli.cjs` 同级用户配置注册表
- **AND** 注册表中的相对会话路径相对于该 `.csg/` 目录解析

#### Scenario: 无可用会话
- **WHEN** Skill 命令行找不到可用会话文件
- **THEN** 命令行以非零状态退出
- **AND** 命令行打印 JSON 错误，说明如何生成或配置会话

### Requirement: Skill 用户配置选择
Skill 命令行 SHALL 支持选择命名用户配置、默认用户配置或全部已配置用户配置。

#### Scenario: 提供用户配置参数
- **WHEN** 调用 Skill 命令行时提供用户配置参数
- **THEN** 命令行使用该用户配置关联的会话
- **AND** 成功结果条目包含用户配置别名

#### Scenario: 请求所有用户配置
- **WHEN** 调用 Skill 命令行时使用所有用户配置选项
- **THEN** 命令行查询所有可加载的已配置用户配置
- **AND** 逐用户配置报告失败，不隐藏成功用户配置的结果

### Requirement: Skill 命令输出契约
Skill 命令行 SHALL 在成功命令中向标准输出输出 JSON，并在失败命令中向标准错误输出 JSON 格式错误。

#### Scenario: 账户命令成功
- **WHEN** 助手使用有效用户配置选择运行账户命令
- **THEN** 标准输出包含账户对象 JSON 数组
- **AND** 每个账户对象包含用户配置别名
- **AND** 标准错误不包含正常结果数据

#### Scenario: 命令失败
- **WHEN** 助手运行的 Skill 命令因校验、会话加载或上游查询失败
- **THEN** 标准错误包含带 `error` 字段的 JSON 对象
- **AND** 进程以非零状态退出

#### Scenario: 批量电表命令部分成功
- **WHEN** 助手针对多个电表运行余额或用量命令，且其中一个电表失败
- **THEN** 标准输出包含每个请求电表的 JSON 结果条目
- **AND** 失败电表条目包含错误字段，而不是中止整个命令

### Requirement: 面向助手的 Skill 指引
Skill 的 `SKILL.md` SHALL 是精简的助手指引，而不是普通项目 README。

#### Scenario: 助手读取 Skill 指引
- **WHEN** 助手加载 Skill
- **THEN** 指引告诉助手分别用哪些命令查询账户、余额、用量和会话状态
- **AND** 指引说明如何选择用户配置或查询所有用户配置
- **AND** 指引说明何时需要先列出账户，再查询账户相关数据
- **AND** 指引提醒助手不要泄露完整户号、地址或会话内容，除非用户明确要求

### Requirement: 拆分构建和打包命令
项目 SHALL 将普通构建和本地凭证打包分离。

#### Scenario: 运行普通构建
- **WHEN** 运行普通项目构建命令
- **THEN** 可以生成 MCP 和 Skill 代码产物
- **AND** 本地会话凭证不会复制到可分发目录

#### Scenario: 请求本地 Skill 包
- **WHEN** 使用已有会话运行本地专用 Skill 包命令
- **THEN** 命令可以将会话复制到 `scripts/.csg/`
- **AND** 命令输出明确说明该包包含本地凭证且不得发布

