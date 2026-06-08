## MODIFIED Requirements

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

#### Scenario: 忽略隐式旧版会话文件
- **WHEN** 调用 Skill 命令行时未提供显式会话路径、未设置环境变量会话路径，且不存在可用 `.csg/profiles.json`
- **AND** 当前工作目录或 `cli.cjs` 同级存在 loose `session.json`
- **THEN** 命令行不得自动读取该 `session.json`
- **AND** 命令行返回无可用会话错误

#### Scenario: 无可用会话
- **WHEN** Skill 命令行找不到可用会话文件
- **THEN** 命令行以非零状态退出
- **AND** 命令行打印 JSON 错误，说明如何生成或配置会话
