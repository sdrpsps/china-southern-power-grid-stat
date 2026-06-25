# AGENTS.md

本文件是本仓库给 Codex、Claude Code 及其他代码 agent 的项目级操作手册。进入仓库后先读本文件，再按任务需要读取 `README.md`、`openspec/`、相关源码和已安装 skill。

维护原则：只放长期有效、代码里不容易读出、AI 猜错会影响结果的规则。能用 lint/test/CI 或 hook 强制的事项优先交给工具；偶发调试发现不要立刻写进来，先沉淀到项目记忆或 issue，反复出现后再收敛成规则。本文件应保持精简，接近 200 行时优先删除低价值内容或改为指向文档/skill。

## 项目定位

这是一个基于 Next.js App Router 的南方电网本地电费查询应用。核心能力包括：

- 使用 Better Auth 保护网页访问。
- 通过本地 SQLite + Drizzle ORM 保存用户配置、南网会话、电表账户、余额快照、月度用量和操作日志。
- 提供网页仪表盘查询账户、余额、欠费、月度每日用电。
- 提供 `china-southern-power-grid` MCP Streamable HTTP 服务，供外部 agent 通过长期 Bearer token 查询本地数据。
- 提供可安装的项目 skill：`skills/china-southern-power-grid-stat/SKILL.md`。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript。
- Tailwind CSS v4、shadcn/ui、lucide-react、Recharts。
- SQLite、better-sqlite3、Drizzle ORM、drizzle-kit。
- Better Auth。
- MCP SDK：`@modelcontextprotocol/sdk`。
- 测试：Vitest。
- 包管理：npm，锁文件为 `package-lock.json`。

## 关键目录

- `app/`：Next.js 路由、页面、API route handlers。
- `app/api/mcp/route.ts`：MCP HTTP 入口。
- `app/api/mcp/token/route.ts`：MCP 长期访问 token 相关入口。
- `app/api/session/**`：南方电网短信、扫码登录和会话验证入口。
- `components/dashboard/`：仪表盘业务组件。
- `components/ui/`：shadcn/ui 本地组件源码。
- `lib/csg/`：南方电网客户端与 mock 行为。
- `lib/services/`：业务服务、查询、profile/session 管理、仓储与校验。
- `lib/db/`：SQLite/Drizzle schema、client、迁移初始化。
- `lib/mcp/`：MCP server、tool handler、MCP 鉴权。
- `tests/`：Vitest 测试，通常使用临时 SQLite 和 `CSG_MOCK=1`。
- `openspec/`：OpenSpec 主规格、变更提案和归档。
- `.codex/skills/`：本仓库已安装的开发协作 skills。
- `skills/china-southern-power-grid-stat/`：对外发布/安装的项目查询 skill。

## 常用命令

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:studio
```

本地演示或测试优先使用 mock 模式：

```bash
CSG_MOCK=1 npm run dev
```

默认本地数据库位于 `data/csg-stat.sqlite`。测试中优先使用临时数据库路径，不要依赖或污染真实本地数据。

## 开发守则

- 先搜索再改动。优先使用 `rg` / `rg --files` 找入口、类型和既有模式。
- 改动范围要小。不要顺手重构无关模块、重排大文件或修改生成物。
- 遵循现有分层：API route 只做请求解析与响应；业务逻辑放 `lib/services/`；南网协议细节放 `lib/csg/`；MCP tool 映射放 `lib/mcp/`。
- 对外返回数据时保持隐私默认安全：不要暴露完整 token、验证码、密码、完整会话、完整敏感账户信息，除非代码既有契约明确要求。
- 涉及缴费户号时使用电表账户返回的 `accountNumber`，不要把 `meteringPointNumber` 当成缴费户号替代。
- 不要假设缴费户号固定 16 位；按 `lib/services/validation.ts` 的当前规则处理。
- 处理多 profile、多账户或部分失败时，保留成功结果并单独报告失败项，不要因为部分失败吞掉全部成功结果。
- 修改数据库 schema 时同步考虑迁移/初始化逻辑、仓储层、测试和 OpenSpec 规格。
- 修改 MCP tool 入参/出参时同步更新 `lib/mcp/server.ts`、相关 route、测试、README、`skills/china-southern-power-grid-stat/SKILL.md` 和 OpenSpec specs。
- 修改网页 UI 时优先复用 `components/ui/` 与 `components/dashboard/` 的现有组件和布局模式。
- Git commit 消息必须遵循 Conventional Commits 规范，例如 `feat: ...`、`fix: ...`、`docs: ...`、`chore: ...`。

## 安全与配置

- 不要提交 `.env`、SQLite 数据库、真实 token、真实手机号、真实地址、真实用户名或南方电网会话。
- `.env.example` 是配置说明来源；新增环境变量时同步更新它和 README。
- MCP token 是长期 secret。不要在聊天、日志、测试快照或文档示例中放真实 token。
- 远程部署说明应要求 HTTPS，避免明文传输 Bearer token。
- 如果 MCP 调用返回未授权、凭证过期或缺失，应引导用户在网页仪表盘重新生成 MCP 凭证，而不是尝试读取浏览器 Cookie 或本地 session 文件。

## 测试策略

- 小改动至少运行相关 Vitest；跨层改动运行 `npm run test`。
- UI、路由、鉴权、MCP、数据库 schema 或构建配置变更后，尽量运行：

```bash
npm run lint
npm run test
npm run build
```

- 测试要使用 mock 与临时数据库。参考 `tests/routes.test.ts` 中的 `CSG_MOCK=1` 和 `CSG_DATABASE_PATH` 模式。
- 新增业务行为应补充靠近行为边界的测试：validation、services、route handler 或 MCP handler。
- 不要让测试依赖真实南网账号、真实网络服务或用户本机数据库。

## 已安装 Skills 的使用

本仓库已安装以下 repo-local skills。符合触发条件时必须优先按对应 `SKILL.md` 执行，而不是自行发明流程。

只在本文件写触发条件和边界；skill 的完整流程以各自 `SKILL.md` 为准，避免把大段说明复制进常驻上下文。

### OpenSpec Skills

- `openspec-explore`：用于探索想法、调查问题、澄清需求。该模式只读代码和规格，不实现代码。适合用户还在讨论“要不要做、怎么做、风险是什么”。
- `openspec-propose`：用于创建新变更提案，一次性生成 proposal、design、tasks 等实现前 artifacts。适合非平凡功能、行为变更、架构变更或跨模块修改。
- `openspec-apply-change`：用于根据已有 OpenSpec change 执行 tasks。实现前必须读取 CLI 返回的 context files，完成一项任务就更新 tasks checkbox。
- `openspec-sync-specs`：用于把 change 下的 delta specs 智能合并到 `openspec/specs/` 主规格，不归档 change。
- `openspec-archive-change`：用于实现完成后归档 change。归档前检查 artifacts、tasks 和 delta spec 同步状态。

OpenSpec 规则：

- 需求不清或方案还在比较时，用 `openspec-explore`。
- 新增能力、改变用户可见行为、改变 MCP/API 契约、改变鉴权/数据模型时，先用 `openspec-propose` 创建 change，除非用户明确要求跳过。
- 用户要求“继续实现某个 change”“按 tasks 做”“apply”时，用 `openspec-apply-change`。
- 用户要求“同步规格”时，用 `openspec-sync-specs`。
- 用户要求“归档/完成这个 change”时，用 `openspec-archive-change`。
- 简单 typo、注释、文档微调、窄范围 bugfix 可直接改，但仍要确认不会违反现有 specs。

### shadcn Skill

- `shadcn`：用于 shadcn/ui 组件管理、组件组合、样式修复、preset、registry、UI 调试。

shadcn 规则：

- 本项目有 `components.json`，UI 相关任务默认触发 shadcn skill。
- 组件优先从 `components/ui/` 复用；新增组件前先检查已安装组件。
- 使用项目别名：`@/components`、`@/components/ui`、`@/lib/utils`。
- 本项目 `iconLibrary` 为 `lucide`，图标使用 `lucide-react`。
- 本项目为 RSC；包含 `useState`、`useEffect`、事件处理或浏览器 API 的组件必须显式加 `"use client"`。
- 表单布局使用 shadcn 的 `FieldGroup` / `Field` 等既有模式；不要用临时 `div` 堆出不一致表单。
- 按钮内图标使用 `data-icon` 约定；不要手写尺寸覆盖组件内图标。
- Tailwind 布局优先用 `gap-*`，不要新增 `space-x-*` / `space-y-*` 风格。

### 项目查询 Skill

- `china-southern-power-grid-stat`：位于 `skills/china-southern-power-grid-stat/SKILL.md`，用于外部 agent 通过已配置的 `china-southern-power-grid` MCP 服务查询余额、欠费、账户和用电详情。

项目查询 skill 维护规则：

- 修改 MCP tool 名称、参数、输出结构或错误语义时，必须同步更新该 skill。
- 该 skill 只描述如何使用已配置的 MCP 服务，不负责启动、安装或配置服务。
- 文档中不要写死用户本机路径、真实 token、真实 MCP 凭证或真实隐私数据。
- 查询用量时必须要求 year/month，并使用 `accountNumber`。
- 每日用电详情输出应包含日期、kWh 和金额；如果上游没有每日电费明细，不要自行估算分摊。

## UI 与产品约束

- 这是操作型仪表盘，不是营销页。界面应密集、清晰、可扫描，避免大幅 hero、装饰性背景和无关插画。
- 常用工作流要直接：登录/创建 profile、查看账户、查余额、查用量、验证会话、查看 MCP 凭证。
- 状态展示要区分 loading、empty、partial failure、error 和 success。
- 对长文本、户号、地址、错误信息要考虑移动端换行和截断，避免内容溢出按钮或表格。
- 图表使用现有 Recharts/shadcn chart 模式；空数据时用明确 empty state。

## API/MCP 契约注意事项

- `list_profiles`：列出本地 profile，不能暴露敏感 session。
- `get_electricity_accounts`：返回可用于后续查询的 `accountNumber`。
- `get_balance`：查询余额和欠费，支持单户号、多户号、allAccounts、profile/allProfiles 选择。
- `get_usage`：查询月度每日用电，必须提供 year 和 month。
- `verify_session`：验证 profile 会话是否仍有效。
- MCP tools 是只读查询工具，应保持非破坏性和幂等语义。

## 交付前检查

提交最终答复或交付代码前，确认：

- 已读相关代码和 specs，没有仅凭猜测修改。
- 新增/修改行为有相应测试或说明了未测试原因。
- `npm run lint`、`npm run test`、`npm run build` 已按风险范围运行，或明确说明未运行。
- 没有泄露 secret、真实账号数据、数据库文件或 `.env`。
- 如果改了 OpenSpec tasks，checkbox 与实际完成状态一致。
- 如果改了 MCP/API 契约，README、tests、OpenSpec specs 和项目 skill 已同步。
