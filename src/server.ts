import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  listAccounts,
  listProfiles,
  normalizeProfileSelector,
  queryBalances,
  queryUsage,
  verifySessions,
} from "./query-service.js";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const profileInputSchema = {
  profile: z.string().optional().describe("要使用的用户配置别名"),
  allProfiles: z.boolean().optional().describe("查询所有已配置用户配置"),
  sessionPath: z.string().optional().describe("显式指定的会话文件路径"),
};

const accountSelectionSchema = {
  ...profileInputSchema,
  accountNumber: z.string().optional().describe("单个 16 位缴费户号"),
  accountNumbers: z
    .array(z.string())
    .optional()
    .describe("多个 16 位缴费户号"),
  allAccounts: z.boolean().optional().describe("查询已发现的所有电表账户"),
};

const errorSchema = z.object({
  profile: z.string(),
  accountNumber: z.string().optional(),
  error: z.string(),
});

const accountSchema = z.object({
  profile: z.string(),
  accountNumber: z.string(),
  areaCode: z.string(),
  eleCustomerId: z.string(),
  meteringPointId: z.string(),
  meteringPointNumber: z.string(),
  address: z.string(),
  userName: z.string(),
});

const balanceSchema = z.object({
  profile: z.string(),
  accountNumber: z.string(),
  address: z.string(),
  userName: z.string(),
  balance: z.number(),
  arrears: z.number(),
});

const usageSchema = z.object({
  profile: z.string(),
  accountNumber: z.string(),
  address: z.string(),
  userName: z.string(),
  year: z.number(),
  month: z.number(),
  monthTotalCost: z.number().nullable(),
  monthTotalKwh: z.number().nullable(),
  ladder: z.object({
    ladder: z.number().nullable(),
    startDate: z.string().nullable(),
    remainingKwh: z.number().nullable(),
    tariff: z.number().nullable(),
  }),
  dailyDetails: z.array(
    z.object({
      date: z.string(),
      charge: z.number(),
      kwh: z.number(),
    }),
  ),
});

function textContent(data: unknown) {
  return [{ type: "text" as const, text: JSON.stringify(data, null, 2) }];
}

function successResult(structuredContent: Record<string, unknown>) {
  return {
    content: textContent(structuredContent),
    structuredContent,
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const structuredContent = { error: message };
  return {
    content: textContent(structuredContent),
    structuredContent,
    isError: true,
  };
}

function getAccountNumbers(args: {
  accountNumber?: string;
  accountNumbers?: string[];
}): string[] {
  return [
    ...(args.accountNumber ? [args.accountNumber] : []),
    ...(args.accountNumbers || []),
  ];
}

const server = new McpServer({
  name: "china-southern-power-grid-mcp",
  version: "1.0.0",
});

server.registerTool(
  "list_profiles",
  {
    description: "列出本地已配置的南方电网用户配置",
    inputSchema: {},
    outputSchema: {
      profiles: z.array(
        z.object({
          alias: z.string(),
          label: z.string().optional(),
          sessionPath: z.string(),
          createdAt: z.string(),
          updatedAt: z.string(),
          source: z.string().optional(),
        }),
      ),
    },
    annotations: readOnlyAnnotations,
  },
  async () => {
    try {
      return successResult(await listProfiles());
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "get_electricity_accounts",
  {
    description:
      "列出默认用户配置、指定用户配置或全部用户配置下的电表账户",
    inputSchema: profileInputSchema,
    outputSchema: {
      accounts: z.array(accountSchema),
      errors: z.array(errorSchema),
    },
    annotations: readOnlyAnnotations,
  },
  async (args) => {
    try {
      const structuredContent = await listAccounts(normalizeProfileSelector(args));
      return successResult(structuredContent);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "get_balance",
  {
    description:
      "查询所选用户配置下一个电表、多个电表或全部电表的余额与欠费",
    inputSchema: accountSelectionSchema,
    outputSchema: {
      balances: z.array(balanceSchema),
      errors: z.array(errorSchema),
    },
    annotations: readOnlyAnnotations,
  },
  async (args) => {
    try {
      const structuredContent = await queryBalances({
        selector: normalizeProfileSelector(args),
        accountNumbers: getAccountNumbers(args),
        allAccounts: args.allAccounts === true,
      });
      return successResult(structuredContent);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "get_usage",
  {
    description:
      "查询所选用户配置下一个电表、多个电表或全部电表的月度用电详情",
    inputSchema: {
      ...accountSelectionSchema,
      year: z.number().int().describe("查询年份，例如 2026"),
      month: z.number().int().describe("查询月份，取值 1 到 12"),
    },
    outputSchema: {
      usages: z.array(usageSchema),
      errors: z.array(errorSchema),
    },
    annotations: readOnlyAnnotations,
  },
  async (args) => {
    try {
      const structuredContent = await queryUsage({
        selector: normalizeProfileSelector(args),
        accountNumbers: getAccountNumbers(args),
        allAccounts: args.allAccounts === true,
        year: args.year,
        month: args.month,
      });
      return successResult(structuredContent);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "verify_session",
  {
    description: "验证默认用户配置、指定用户配置或全部用户配置的会话状态",
    inputSchema: profileInputSchema,
    outputSchema: {
      profiles: z.array(
        z.object({
          profile: z.string(),
          valid: z.boolean(),
          reason: z.string().optional(),
        }),
      ),
    },
    annotations: readOnlyAnnotations,
  },
  async (args) => {
    try {
      const structuredContent = await verifySessions(normalizeProfileSelector(args));
      return {
        ...successResult(structuredContent),
        isError: structuredContent.profiles.some((profile) => !profile.valid),
      };
    } catch (error) {
      return errorResult(error);
    }
  },
);

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("南方电网 MCP 服务已通过标准输入输出启动");
}

startServer().catch((error) => {
  console.error("MCP 服务运行时发生致命错误：", error);
  process.exit(1);
});
