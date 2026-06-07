// @ts-ignore
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { CSGClient } from "./csg-client.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// session.json 路径定位，依次尝试项目根目录、dist目录和当前工作目录
const SESSION_FILE_PATH = (() => {
  const paths = [
    path.resolve(__dirname, "../session.json"),
    path.resolve(__dirname, "session.json"),
    path.resolve(process.cwd(), "session.json"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return paths[0]; // 默认返回第一个
})();
/**
 * 载入并初始化南方电网客户端
 */
async function getInitializedClient() {
  if (!fs.existsSync(SESSION_FILE_PATH)) {
    throw new Error(
      "未找到 session.json。请先在终端中运行 `pnpm run login` 完成南方电网扫码/验证码登录。",
    );
  }
  const sessionContent = await fs.promises.readFile(SESSION_FILE_PATH, "utf-8");
  let sessionData;
  try {
    sessionData = JSON.parse(sessionContent);
  } catch (e) {
    throw new Error(
      "session.json 格式损坏，请运行 `pnpm run login` 重新登录。",
    );
  }
  const client = CSGClient.load(sessionData);
  try {
    await client.initialize();
  } catch (error) {
    throw new Error(
      `初始化电网客户端失败 (可能是会话过期)，请运行 \`pnpm run login\` 重新登录。错误详情: ${error?.message}`,
    );
  }
  return client;
}
// 初始化 MCP 服务器
// @ts-ignore
const server = new Server(
  {
    name: "china-southern-power-grid-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);
// 注册支持的 Tool 列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_electricity_accounts",
        description: "获取当前登录账号下绑定的所有用电账户（电表）列表",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_balance",
        description: "查询指定缴费户号的电费余额及欠费信息",
        inputSchema: {
          type: "object",
          properties: {
            accountNumber: {
              type: "string",
              description:
                "16 位用电缴费户号（可在 get_electricity_accounts 中查询到）",
            },
          },
          required: ["accountNumber"],
        },
      },
      {
        name: "get_usage",
        description:
          "查询指定缴费户号在特定月份的每日电量、电费明细与当前阶梯计费信息",
        inputSchema: {
          type: "object",
          properties: {
            accountNumber: {
              type: "string",
              description: "16 位用电缴费户号",
            },
            year: {
              type: "number",
              description: "查询年份，例如 2026",
            },
            month: {
              type: "number",
              description: "查询月份 (1-12)，例如 6",
            },
          },
          required: ["accountNumber", "year", "month"],
        },
      },
      {
        name: "verify_session",
        description: "验证当前保存的登录状态 (session.json) 是否仍然有效",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});
// 处理具体 Tool 调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    // 处理 verify_session 的情况（可以先不进行初始化）
    if (name === "verify_session") {
      if (!fs.existsSync(SESSION_FILE_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "未找到 session.json。登录状态失效，请运行 `pnpm run login` 登录。",
            },
          ],
          isError: true,
        };
      }
      const sessionContent = await fs.promises.readFile(
        SESSION_FILE_PATH,
        "utf-8",
      );
      const client = CSGClient.load(JSON.parse(sessionContent));
      await client.initialize();
      const isValid = await client.verifyLogin();
      return {
        content: [
          {
            type: "text",
            text: isValid
              ? "登录状态有效，可正常使用查询功能。"
              : "登录已失效，请运行 `pnpm run login` 重新登录。",
          },
        ],
        isError: !isValid,
      };
    }
    // 其它接口需要获取初始化好的 Client
    const client = await getInitializedClient();
    if (name === "get_electricity_accounts") {
      const accounts = await client.getAllElectricityAccounts();
      const formattedAccounts = accounts.map((acc) => acc.dump());
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedAccounts, null, 2),
          },
        ],
      };
    }
    if (name === "get_balance") {
      const { accountNumber } = args;
      const accounts = await client.getAllElectricityAccounts();
      const targetAccount = accounts.find(
        (acc) => acc.accountNumber === accountNumber,
      );
      if (!targetAccount) {
        throw new Error(`未找到缴费户号为 ${accountNumber} 的电表账户`);
      }
      const balanceData = await client.getBalanceAndArrears(targetAccount);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                accountNumber: targetAccount.accountNumber,
                address: targetAccount.address,
                userName: targetAccount.userName,
                balance: balanceData.balance,
                arrears: balanceData.arrears,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    if (name === "get_usage") {
      const { accountNumber, year, month } = args;
      const accounts = await client.getAllElectricityAccounts();
      const targetAccount = accounts.find(
        (acc) => acc.accountNumber === accountNumber,
      );
      if (!targetAccount) {
        throw new Error(`未找到缴费户号为 ${accountNumber} 的电表账户`);
      }
      const usageData = await client.getMonthDailyCostDetail(
        targetAccount,
        year,
        month,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                accountNumber: targetAccount.accountNumber,
                address: targetAccount.address,
                userName: targetAccount.userName,
                year,
                month,
                monthTotalCost: usageData.monthTotalCost,
                monthTotalKwh: usageData.monthTotalKwh,
                ladder: usageData.ladder,
                dailyDetails: usageData.byDay,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    throw new Error(`未知的工具请求: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `[Error] ${error?.message || error}`,
        },
      ],
      isError: true,
    };
  }
});
// 启动 Stdio 传输通道的 MCP 服务器
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("China Southern Power Grid MCP Server running on stdio");
}
startServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
