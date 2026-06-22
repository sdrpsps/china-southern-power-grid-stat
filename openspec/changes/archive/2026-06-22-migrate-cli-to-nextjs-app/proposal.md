## Why

当前项目的核心能力主要集中在 `cli-src` 的命令行脚本和 MCP 服务中，用户需要通过参数和本地文件完成登录态管理、账户发现、余额查询和用量查询。将这些能力迁移到 Next.js App Router 后，可以提供可视化操作入口、统一的服务端 API、可部署的 Web 应用形态，并为后续数据分析和长期留存打下基础。

## What Changes

- 在 Next.js App Router 中实现南方电网查询应用，替代纯命令行入口作为主要用户界面。
- 复用并迁移 `cli-src` 中的南方电网 API 客户端、账户发现、余额查询、月度用量查询、会话验证和输入校验逻辑，但新代码不得在 `cli-src` 目录内创建或修改文件。
- 新增前端页面，用于用户配置管理、网页登录、账户列表、余额查询、月度用电明细查询、错误展示和刷新操作。
- 前端 UI 组件优先使用已初始化的 shadcn/ui 组件体系，并按需添加缺失的 shadcn/ui 基础组件。
- 新增 App Router API route 或 server action 层，向前端暴露 profiles、accounts、verify、balance、usage、login/session 等服务端能力。
- 使用 SQLite 存储本地业务数据，并通过 Drizzle ORM 操作用户配置、会话元数据、账户快照、余额快照、月度用量和查询日志。
- 为部署新增 Docker 打包能力，产物可通过容器启动 Next.js 服务并挂载 SQLite 数据目录。
- 保留敏感数据保护要求：会话令牌、密码、短信验证码、户号、地址和用户名不得在非必要位置明文暴露。
- **BREAKING**: 主要运行入口从纯 CLI 脚本迁移为 Next.js Web 应用；旧 `cli-src` 目录只作为迁移参考，不再作为新增能力的实现位置。

## Capabilities

### New Capabilities

- `nextjs-electricity-dashboard`: 覆盖 App Router 页面、交互流程、服务端接口和前端结果展示，用于替代 CLI 查询体验。
- `sqlite-drizzle-persistence`: 覆盖 SQLite 数据模型、Drizzle ORM 访问、迁移、数据缓存和敏感字段存储约束。
- `dockerized-nextjs-deployment`: 覆盖 Docker 构建、运行配置、数据卷、环境变量和部署启动行为。

### Modified Capabilities

- `credential-login`: 登录与会话生成能力需要支持 Next.js Web 流程，并将会话持久化接入 SQLite/本地数据目录。
- `multi-user-profiles`: 多用户配置能力需要从 JSON 注册表扩展为 SQLite 管理，并支持 Web 页面和服务端 API 选择用户配置。

## Impact

- Affected code: `app/`, shared server-side modules under the Next.js implementation, Drizzle schema and migrations, Dockerfile and deployment configuration.
- Affected APIs: New App Router route handlers or server actions for login/session, profile selection, account discovery, balance, usage and session verification.
- Affected dependencies: Add SQLite driver, Drizzle ORM, Drizzle migration tooling, and only add extra UI dependencies when shadcn/ui or the existing component stack does not cover the interaction.
- Affected data: Web login creates or updates SQLite-backed profiles and server-side sessions under a configurable application data directory.
- Affected deployment: Build and runtime must support `next build`, container startup, SQLite persistence via volume mount, and configuration through environment variables.
