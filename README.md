# 南方电网 (CSG) 查询服务 (MCP & Skill)

本项目是一个使用 TypeScript 开发的独立南方电网 (China Southern Power Grid) 账户数据查询服务，**同时支持 MCP (Model Context Protocol) 服务端与零依赖自包含的 Skill 技能包形式**。它可以脱离 HomeAssistant 独立运行，并提供以下两种主流 AI 接入模式：

1. **MCP 模式**：作为后台常驻进程，供 **Cursor**、**Claude Desktop** 等 AI 客户端直接作为 Tools 隐式调用。
2. **Skill 模式**：提供完全纯粹、零第三方依赖且包含登录凭证的独立技能包（仅含 `SKILL.md` 和 `cli.cjs` 脚本），可直接拷贝到 **OpenClaw** 等本地 Agent 系统中直接零依赖直接调用。

![image](https://i.111666.best/image/H31G7sDcGWgKRRTAxMJAKQ.png)

---

## 核心功能

- **双登录渠道支持**：提供命令行交互登录向导，支持短信验证码登录、账号密码+短信登录以及扫码登录（微信、支付宝、南网 APP）。
- **会话持久化与分发**：登录成功后，认证凭证存入 `session.json`，在 `pnpm run build` 时会自动且安全地将其分发至 Skill 包内部，实现发布即可运行。
- **丰富的查询接口**：
  - `get_electricity_accounts`：获取该用户绑定的所有用电账户（包含缴费户号、户名、地址）。
  - `get_balance`：根据缴费户号查询实时余额（元）与欠费情况（元）。
  - `get_usage`：查询指定账户在特定月份的每日电量电费、月度统计、阶梯计费（当前阶梯数及档内剩余可用额度）等明细。
  - `verify_session`：检测当前缓存的会话状态是否仍然有效。

---

## 安装与初始化步骤

### 1. 安装项目依赖

确保你的开发环境中已安装 Node.js (建议 v18+) 和 `pnpm` 包管理器。在根目录下执行：

```bash
pnpm run install
```

### 2. 命令行交互登录 (生成凭证)

在根目录下运行以下命令，并根据提示选择你的登录方式（推荐选择**扫码登录**以获得最方便的体验）：

```bash
pnpm run login
```

登录成功后，会在根目录下自动生成 `session.json` 会话凭证文件。

### 3. 一键构建与打包

运行以下构建脚本：

```bash
pnpm run build
```

执行后会进行两项工作：

1. 使用 `tsc` 编译出 MCP 服务所需的 `mcp` 运行产物。
2. 使用 `esbuild` 自动把客户端核心逻辑打包为**零外部依赖**的独立单文件脚本，输出到 Skill 发布包 `skills/china-southern-power-grid-stat/scripts/cli.cjs` 中。如果本地存在 `session.json`，也会自动将其拷贝至该 Skill 文件夹内。

---

## 形式 A：集成到 MCP 客户端 (Cursor / Claude)

由于 MCP 是基于进程间通信的，启动时会自动加载本地 `session.json`。

### 1. Cursor 配置方式

1. 打开 Cursor 设置：**Settings** -> **Features** -> **MCP**。
2. 点击 **+ Add New MCP Server**：
   - **Name**: `china-southern-power-grid`
   - **Type**: `command`
   - **Command**: `npx tsx /Users/sunny/Documents/electric/src/server.ts`
     _(请务必将路径替换为您本机项目的实际绝对路径。并且在执行此命令前，确保已成功运行 `pnpm run login` 生成了 `session.json`)_
3. 保存并确认指示灯为绿色。

### 2. Claude Desktop 配置方式

在你的 Claude Desktop 配置文件（通常位于 `~/Library/Application Support/Claude/claude_desktop_config.json`）的 `mcpServers` 字段下添加：

```json
{
  "mcpServers": {
    "china-southern-power-grid": {
      "command": "npx",
      "args": ["tsx", "/Users/sunny/Documents/electric/src/server.ts"],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      }
    }
  }
}
```

---

## 形式 B：集成到 OpenClaw (Skill 模式)

我们生成的 `skills/china-southern-power-grid-stat` 目录是一个完全纯粹、零依赖的技能包。

### 1. 技能包目录结构

```text
skills/china-southern-power-grid-stat/
├── SKILL.md            # 面向 AI 的技能描述文档，带标准 YAML 元数据
├── session.json        # 构建时自动拷贝的登录会话凭证
└── scripts/
    └── cli.cjs         # esbuild 混淆打包后的单文件脚本
```

### 2. 集成到 OpenClaw

你只需将 `china-southern-power-grid-stat` 这个独立的子目录拷贝到 OpenClaw 的本地 Skill 路径下（例如 `~/.openclaw/workspace/skills/`）：

一旦放入，OpenClaw 会自动解析 `SKILL.md`，Agent 就能在需要时直接通过 `node ./scripts/cli.cjs` 命令来为你查询数据。

命令行详细调用参数参见 [SKILL.md](skills/china-southern-power-grid-stat/SKILL.md)。

---

## 项目开发结构

- `src/consts.ts`：南方电网 API 接口路由、AES/RSA 密钥等常量配置。
- `src/csg-client.ts`：包含零填充的 AES-128-CBC 加解密、RSA PKCS1 密码加密，及对电网 API 的 fetch 封装。
- `src/login.ts`：支持多登录渠道的控制台交互式登录生成器。
- `src/cli.ts`：命令行交互查询入口，供打包为 Skill 独立单文件时使用。
- `src/server.ts`：实现 stdio 传输通道的标准 MCP 服务器。
- `skills/`：发布出的 OpenClaw 标准技能包文件夹。

---

## 鸣谢 (Credits)

本项目的核心电网 API 加解密算法与业务请求封装思路，参考并修改自原 HomeAssistant 自定义集成项目：

- [lmh555168/china_southern_power_grid_stat](https://github.com/lmh555168/china_southern_power_grid_stat)

特此向原作者的开源贡献表示诚挚的感谢！

---

## 参与贡献 (Contributing)

本项目完全开源，如果您在使用中遇到了新的接口需求、南网 API 协议升级，或发现了任何 Bug，非常欢迎提交 Issue 或**直接提交 Pull Request (PR)** 来共同完善本项目！您的贡献将让更多使用本地 AI 助手的开发者受益。
