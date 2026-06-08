# 南方电网查询服务（MCP 与 Skill）

本项目是一个使用 TypeScript 实现的南方电网账户数据查询服务，支持两种本地人工智能接入方式：

1. **MCP 模式**：作为标准输入输出 MCP 服务器，给 Cursor、Claude Desktop 等客户端提供结构化工具。
2. **Skill 模式**：生成可复制的本地 Skill 包，通过零依赖 `cli.cjs` 脚本查询电表数据。

项目支持多个本地用户配置。每个用户配置对应一个南方电网登录会话，一个用户配置下可以包含多个已绑定电表。

![image](https://cdn.nodeimage.com/i/8OWxL84oOIE0xesjVrgXSYnceQQXXj16.webp)

## 功能

- 多用户配置登录态管理：例如 `home`、`parents`、`shop`。
- 查询用户配置列表、绑定电表账户、电费余额、欠费、月度每日用电详情。
- 支持单个用户配置、所有用户配置、单户号、多户号、所有户号查询。
- MCP 工具返回结构化 `structuredContent`，同时保留文本 JSON 内容。
- MCP 和 Skill 构建产物都可以零依赖复制部署，只需要目标环境有 Node.js。
- Skill 命令行成功时输出 JSON 到标准输出，失败时输出 JSON 错误到标准错误。
- 普通构建不会复制本地凭证；只有显式本地专用打包才会把 `.csg` 凭证打进 Skill 包。

## 安装

```bash
pnpm install
```

## 登录与用户配置

交互式登录并创建或更新用户配置：

```bash
pnpm run login
```

也可以直接指定用户配置：

```bash
pnpm run login --profile=home
```

助手引导模式会输出 JSON 状态事件，适合对话式登录流程：

```bash
pnpm run login:agent --profile=home --method=qr --qr-channel=wechat
```

登录成功后，凭证默认保存在本地 `.csg/` 目录下：

```text
.csg/
├── profiles.json
└── sessions/
    └── home.session.json
```

`.csg/` 是本地敏感数据，不要提交、发布或分享。

## 构建

普通构建只生成代码产物，不复制凭证：

```bash
pnpm run build
```

单独构建 MCP 或 Skill：

```bash
pnpm run build:mcp
pnpm run build:skill
```

`build:mcp` 会生成单文件 `mcp/server.cjs`，已经包含 MCP SDK、结构校验和项目查询逻辑。复制部署 MCP 时不需要携带 `node_modules` 或 `package.json`。

如果确实需要本机私用的 Skill 包，可以显式打包本地凭证：

```bash
pnpm run pack:skill-local
```

这个命令会复制 `.csg/` 到 Skill 脚本目录，仅适合本机使用，不要发布或分享生成后的 Skill 包。

## 复制部署目录层级

MCP 和 Skill 都是零依赖代码产物，但都需要能找到本地 `.csg/` 凭证目录。推荐把 `.csg/` 放在可执行文件同级：MCP 放在 `server.cjs` 同级，Skill 放在 `cli.cjs` 同级。`.csg/` 是敏感数据，只能放在你自己的本机或受信任环境中，不要提交、发布或分享。

### MCP 部署层级

MCP 部署时，`.csg/` 放在 `server.cjs` 同级：

```text
csg-mcp-deploy/
└── mcp/
    ├── server.cjs
    └── .csg/
        ├── profiles.json
        └── sessions/
            └── home.session.json
```

MCP 客户端启动：

```bash
node /绝对路径/csg-mcp-deploy/mcp/server.cjs
```

这种层级下，服务会优先通过 `mcp/.csg/profiles.json` 找到凭证。

### Skill 部署层级

Skill 部署时，`.csg/` 放在 `cli.cjs` 同级，也就是 `scripts/` 目录内部：

```text
china-southern-power-grid-stat/
├── SKILL.md
└── scripts/
    ├── cli.cjs
    └── .csg/
        ├── profiles.json
        └── sessions/
            └── home.session.json
```

可以手动复制：

```bash
cp -R skills/china-southern-power-grid-stat /你的 Skill 目录/
cp -R .csg /你的 Skill 目录/china-southern-power-grid-stat/scripts/.csg
```

也可以先在项目内运行：

```bash
pnpm run pack:skill-local
```

然后复制整个 `skills/china-southern-power-grid-stat/` 目录。这个方式只适合本机私用。

### MCP 和 Skill 共用同一份凭证

如果不想复制两份 `.csg/`，可以把凭证放到独立安全目录，然后给 MCP 或 Skill 启动环境设置 `CSG_PROFILE_REGISTRY`：

```bash
CSG_PROFILE_REGISTRY=/安全目录/.csg/profiles.json node /部署目录/mcp/server.cjs
```

Skill 命令也可以使用同一个环境变量：

```bash
CSG_PROFILE_REGISTRY=/安全目录/.csg/profiles.json node ./scripts/cli.cjs --action=profiles
```

使用 `CSG_PROFILE_REGISTRY` 时，`profiles.json` 中的相对会话路径会相对于它所在的 `.csg/` 目录解析。

## MCP 模式

先构建：

```bash
pnpm run build:mcp
```

Cursor 或 Claude Desktop 配置示例：

```json
{
  "mcpServers": {
    "china-southern-power-grid": {
      "command": "node",
      "args": ["[部署目录]/mcp/server.cjs"]
    }
  }
}
```

MCP 工具：

- `list_profiles`：列出本地用户配置。
- `get_electricity_accounts`：列出指定用户配置或所有用户配置的电表账户。
- `get_balance`：查询一个或多个户号的余额和欠费。
- `get_usage`：查询一个或多个户号的月度每日用电详情。
- `verify_session`：验证指定用户配置或所有用户配置的登录状态。

工具参数支持：

- `profile`：指定用户配置别名。
- `allProfiles`：查询所有用户配置。
- `sessionPath`：临时指定单个会话文件。
- `accountNumber` / `accountNumbers`：指定一个或多个缴费户号。
- `allAccounts`：查询选中用户配置下所有电表。

## Skill 模式

构建 Skill 脚本：

```bash
pnpm run build:skill
```

Skill 包位于：

```text
skills/china-southern-power-grid-stat/
├── SKILL.md
└── scripts/
    └── cli.cjs
```

常用命令：

```bash
node ./scripts/cli.cjs --action=profiles
node ./scripts/cli.cjs --action=accounts --profile=home
node ./scripts/cli.cjs --action=accounts --all-profiles
node ./scripts/cli.cjs --action=balance --profile=home --account=<缴费户号>
node ./scripts/cli.cjs --action=balance --all-profiles --all-accounts
node ./scripts/cli.cjs --action=usage --profile=home --account=<缴费户号> --year=2026 --month=6
node ./scripts/cli.cjs --action=verify --all-profiles
```

会话查找顺序：

1. `--session=/path/to/session.json`
2. 环境变量 `CSG_SESSION_FILE`
3. 本地 `.csg/` 用户配置注册表

## 开发结构

- `src/consts.ts`：南方电网接口常量。
- `src/csg-client.ts`：南方电网接口客户端、加解密和高层接口封装。
- `src/profile.ts`：本地用户配置注册表、会话路径解析和登录态加载。
- `src/query-service.ts`：MCP 和 Skill 共享的用户配置感知查询服务。
- `src/login.ts`：交互式和助手引导登录。
- `src/cli.ts`：Skill 命令行入口。
- `src/server.ts`：MCP 标准输入输出服务。
- `skills/`：生成的 Skill 包。

## 致谢

核心电网接口加解密算法与业务请求封装思路参考并修改自：

- [lmh555168/china_southern_power_grid_stat](https://github.com/lmh555168/china_southern_power_grid_stat)
