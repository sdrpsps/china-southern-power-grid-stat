# 南方电网电费查询 Next.js 版

这是一个基于 Next.js App Router 的南方电网本地查询应用。应用将用户配置、会话元数据、电表账户快照、余额快照、月度用量和操作日志存储在 SQLite 中，并通过 Drizzle ORM 访问。

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

默认数据库位置是 `./data/csg-stat.sqlite`。可以通过环境变量调整：

```bash
CSG_DATA_DIR=/absolute/data/dir npm run dev
# 或
CSG_DATABASE_PATH=/absolute/data/dir/csg-stat.sqlite npm run dev
```

## 网页登录

页面支持通过南方电网账号在浏览器中添加用户配置：

- 短信验证码登录
- 账号密码加短信验证码登录
- 扫码登录，可选择微信、支付宝或南网 App

登录成功后，应用会自动创建用户配置并把服务端会话保存到 SQLite。页面不会展示完整令牌、密码或短信验证码。

## Mock 模式

本地 smoke test 或没有真实会话时可以使用 mock 模式：

```bash
CSG_MOCK=1 npm run dev
```

在页面使用任意手机号和验证码完成 mock 登录后，可以查询 mock 电表账户、余额和用量数据。

## MCP 与 Skill

项目提供名为 `china-southern-power-grid` 的 MCP 服务，供 `skills/china-southern-power-grid-stat/SKILL.md` 中的 guide-only Skill 调用。Skill 只描述助手应如何选择用户配置、电表账户和输出格式；实际数据访问由这个 Next.js 项目的 MCP 工具完成。

MCP 工具使用和网页相同的 SQLite 数据库，因此先通过网页登录生成用户配置和会话，再让 MCP 客户端连接本项目即可。

可用工具：

- `list_profiles`：列出本地用户配置。
- `get_electricity_accounts`：列出默认、指定或全部用户配置下的电表账户。
- `get_balance`：查询一个、多个或全部电表的余额与欠费。
- `get_usage`：查询一个、多个或全部电表的月度每日用电详情。
- `verify_session`：验证默认、指定或全部用户配置的登录状态。

### URL 接入

启动 Next.js 后，MCP Streamable HTTP 端点为：

```text
http://localhost:3000/api/mcp
```

示例：

```bash
npm run dev
```

然后在支持 Streamable HTTP MCP 的 agent 中，把服务名配置为 `china-southern-power-grid`，URL 指向 `http://localhost:3000/api/mcp`。

## 测试与构建

```bash
npm run lint
npm run test
npm run build
```

## Docker 部署

构建镜像：

```bash
docker build -t csg-stat-next .
```

运行容器并挂载 SQLite 数据目录：

```bash
docker run --rm \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e CSG_DATA_DIR=/data \
  csg-stat-next
```

访问 [http://localhost:3000](http://localhost:3000)。

如果不挂载 `/data`，应用仍会启动，但容器替换后 SQLite 数据不会保留。

Mock smoke test：

```bash
docker run --rm \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e CSG_DATA_DIR=/data \
  -e CSG_MOCK=1 \
  csg-stat-next
```
