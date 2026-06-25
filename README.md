# 南方电网电费查询

这是一个基于 Next.js App Router 的南方电网本地查询应用。应用使用内置 SQLite 存储用户配置、会话元数据、电表账户快照、余额快照、月度用量和操作日志，并通过 Drizzle ORM 进行访问。

## 🔒 安全加固配置

为了防范未经授权的访问，本应用内置了基于 `better-auth` 的安全加固系统。在首次启动或部署应用前，您需要配置相应的环境变量。

### 1. 配置环境变量

请复制项目根目录下的 `.env.example` 并重命名为 `.env`：

```bash
cp .env.example .env
```

随后修改 `.env` 里的必要选项：

- **`APP_BASE_PATH`**：可选的应用挂载路径前缀，例如 `/electricity`。默认留空表示根路径。
- **`BETTER_AUTH_SECRET`**：用于 Token 加密的密钥，可在终端执行 `openssl rand -hex 32` 生成一个随机串。
- **`BETTER_AUTH_URL`**：您部署应用的外部访问 URL。如果设置了 `APP_BASE_PATH` 时请填写完整应用入口，例如 `https://mcp.example.com/electricity`。
- **`MCP_TOKEN_EXPIRES_IN_DAYS`**：Agent MCP 长期访问凭证的有效天数，默认 `365` 天。该值必须不小于 `300`，非法值会回退到默认值。

路径前缀部署时，`BETTER_AUTH_URL` 和 `APP_BASE_PATH` 应表达同一个外部入口。项目会自动为 Better Auth 补上 `/api/auth`，不要手动把 `/api/auth` 写进 `BETTER_AUTH_URL`：

```text
BETTER_AUTH_URL=https://mcp.example.com/electricity
APP_BASE_PATH=/electricity
```

上述配置下，Better Auth 实际使用的 auth base URL 会是 `https://mcp.example.com/electricity/api/auth`。

### 2. 初始化管理员

配置好 `.env` 并启动应用后，访问 `http://localhost:3000` 将会自动重定向至登录页。由于系统当前没有任何用户，您将看到**创建管理员账户**表单。创建首个管理员后，系统将自动关闭公网注册功能，此后访问系统必须使用该账号进行登录。

## 🚀 快速开始

### 本地开发

1. **安装依赖**：

   ```bash
   npm install
   ```

2. **启动开发服务器**：

   ```bash
   npm run dev
   ```

3. **访问页面**：
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

### 💾 数据库说明

应用使用本地 SQLite 数据库来持久化所有数据：

- **数据库文件**：`csg-stat.sqlite`
- **默认存放路径**：项目根目录下的 `data` 目录（即 `./data/csg-stat.sqlite`）

_注：您无需手动配置任何环境变量来指定数据库位置，应用会自动在项目根目录下生成 `data` 文件夹和数据库文件。_

---

## 🔑 网页登录说明

应用支持在浏览器中安全、快速地添加南方电网用户配置：

- 💬 **短信验证码登录**
- 🔐 **账号密码 + 短信验证码登录**
- 📸 **扫码登录**（支持使用微信、支付宝或南方电网 App 扫码）

> **安全说明**：登录成功后，应用会自动建立用户配置，并仅在本地 SQLite 中加密或安全保存服务端 Session 会话。页面和后台不会传输或记录您的完整敏感令牌、明文密码或验证码。

---

## 🧪 Mock 模式（演示与测试）

在进行本地冒烟测试（Smoke Test）或没有真实南方电网账号时，可以启用模拟数据模式：

```bash
CSG_MOCK=1 npm run dev
```

在 Mock 模式下，您可以使用任意手机号和验证码在页面中登录。登录后，应用会生成模拟的电表账户、余额、历史月度用量以及每日用电详情，方便体验完整的产品功能。

---

## 🤖 MCP 服务与 Agent 集成

本项目提供了一个标准的 MCP (Model Context Protocol) 服务，名为 `china-southern-power-grid`，可以无缝对接 AI Agent 或客户端工具。

### MCP 工具列表

- 📋 `list_profiles`：列出本地保存的所有用户配置。
- ⚡ `get_electricity_accounts`：查询并列出指定配置下的电表账户。
- 💰 `get_balance`：查询电表余额与欠费详情。
- 📊 `get_usage`：查询电表月度用电历史与每日用电明细。
- 🔍 `verify_session`：验证当前用户会话的登录有效性。

### 集成方式

启动 Next.js 项目后，MCP Streamable HTTP 服务端点为：

```text
http://localhost:3000/api/mcp
```

如果容器运行时设置了 `APP_BASE_PATH=/electricity`，则公网路径会变为：

```text
https://mcp.example.com/electricity/api/mcp
```

**⚠️ 重要（安全认证）**：
为了保护您的账户信息，MCP API 已启用长期 Bearer token 鉴权。默认情况下，仪表盘生成的 MCP token 有效期为 `365` 天，可通过 `MCP_TOKEN_EXPIRES_IN_DAYS` 调整。

1.  在登录系统后，点击仪表盘顶部的 **“查看 MCP 凭证”** 按钮并复制生成的 MCP 访问令牌。
2.  在您的 Agent 配置文件中，加入以下配置进行接入：
    ```json
    {
      "mcpServers": {
        "china-southern-power-grid": {
          "url": "http://localhost:3000/api/mcp",
          "headers": {
            "Authorization": "Bearer YOUR_COPIED_JWT_TOKEN"
          }
        }
      }
    }
    ```
3.  如果曾复制过旧的短期 JWT，请重新在仪表盘生成 MCP 凭证并替换 Agent 配置。

请将 MCP token 视为长期 API secret，不要在聊天中粘贴完整 token，也不要提交到 Git。若 token 泄露，请重新生成并更新 Agent 配置；如需让所有旧 token 失效，请轮换 `BETTER_AUTH_SECRET` 或清理/轮换服务端 JWKS 签名密钥。远程部署时请使用 HTTPS，避免在明文链路中传输 Bearer token。

---

## 📦 Docker 部署

本应用支持使用 Docker 快速部署。默认情况下，镜像内已预设了 `/data` 为数据存储目录。

### 1. 构建本地镜像

```bash
docker build -t csg-stat-next .
```

Docker 镜像默认会使用一个 Next.js base path 占位符构建。容器启动时，`docker-entrypoint.sh` 会把构建产物中的占位符替换为运行时传入的 `APP_BASE_PATH`。因此同一镜像可以部署到根路径、`/electricity` 或其他路径前缀。

如果已经启动过一个容器实例并完成占位符替换，之后要改成另一个路径前缀，请重新创建容器实例，不要只修改旧容器的环境变量后重启。

### 2. 运行容器

将本地主机的持久化数据目录挂载到容器的 `/data` 目录，并**必须传入 Better Auth 的安全配置变量**：

```bash
docker run -d \
  --name csg-stat \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e BETTER_AUTH_SECRET="your_openssl_generated_secret" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  csg-stat-next
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

如果要通过同一域名的 `/electricity` 路径访问整个应用：

```bash
docker run -d \
  --name csg-stat \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e APP_BASE_PATH="/electricity" \
  -e BETTER_AUTH_SECRET="your_openssl_generated_secret" \
  -e BETTER_AUTH_URL="https://mcp.example.com/electricity" \
  csg-stat-next
```

### 3. Mock 模式容器运行

```bash
docker run -d \
  --name csg-stat-mock \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e CSG_MOCK=1 \
  -e BETTER_AUTH_SECRET="your_openssl_generated_secret" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  csg-stat-next
```

---

## 🛠️ 测试与生产构建

- **代码检查**：`npm run lint`
- **运行单元测试**：`npm run test`
- **生产版本构建**：`npm run build`

## 致谢

核心电网接口加解密算法与业务请求封装思路参考并修改自：

- [lmh555168/china_southern_power_grid_stat](https://github.com/lmh555168/china_southern_power_grid_stat)
