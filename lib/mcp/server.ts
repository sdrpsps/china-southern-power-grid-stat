import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod/v4"

import { verifyStoredProfiles } from "@/lib/services/profiles"
import { listAccounts, queryBalances, queryUsage } from "@/lib/services/queries"
import { getProfiles } from "@/lib/services/profiles"
import {
  getAccountNumbers,
  getErrorMessage,
  normalizeProfileSelector,
} from "@/lib/services/validation"

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
}

const profileInputSchema = {
  profile: z.string().optional().describe("要使用的用户配置别名"),
  allProfiles: z.boolean().optional().describe("查询所有已配置用户配置"),
}

const accountSelectionSchema = {
  ...profileInputSchema,
  accountNumber: z
    .string()
    .optional()
    .describe("单个缴费户号，使用账户列表返回的 accountNumber"),
  accountNumbers: z
    .array(z.string())
    .optional()
    .describe("多个缴费户号，使用账户列表返回的 accountNumber"),
  allAccounts: z.boolean().optional().describe("查询已发现的所有电表账户"),
}

const queryErrorSchema = z.object({
  profile: z.string(),
  accountNumber: z.string().optional(),
  error: z.string(),
})

const profileSchema = z.object({
  id: z.number(),
  alias: z.string(),
  label: z.string().nullable(),
  isDefault: z.boolean(),
  hasSession: z.boolean(),
  sessionValid: z.boolean().nullable(),
  lastVerifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const accountSchema = z.object({
  profile: z.string(),
  accountNumber: z.string(),
  areaCode: z.string(),
  eleCustomerId: z.string(),
  meteringPointId: z.string(),
  meteringPointNumber: z.string(),
  address: z.string(),
  userName: z.string(),
  refreshedAt: z.string().optional(),
})

const balanceSchema = z.object({
  profile: z.string(),
  accountNumber: z.string(),
  address: z.string(),
  userName: z.string(),
  balance: z.number(),
  arrears: z.number(),
  queriedAt: z.string().optional(),
})

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
    })
  ),
  queriedAt: z.string().optional(),
})

const verifyProfileSchema = z.object({
  profile: z.string(),
  valid: z.boolean(),
  reason: z.string().optional(),
  lastVerifiedAt: z.string().optional(),
})

function textContent(data: unknown) {
  return [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
}

export function successResult(structuredContent: Record<string, unknown>) {
  return {
    content: textContent(structuredContent),
    structuredContent,
  }
}

export function errorResult(error: unknown) {
  const structuredContent = { error: getErrorMessage(error) }
  return {
    content: textContent(structuredContent),
    structuredContent,
    isError: true,
  }
}

export const mcpHandlers = {
  async listProfiles() {
    try {
      return successResult(await getProfiles())
    } catch (error) {
      return errorResult(error)
    }
  },

  async listAccounts(args: unknown) {
    try {
      const structuredContent = await listAccounts(normalizeProfileSelector(args))
      return successResult(structuredContent)
    } catch (error) {
      return errorResult(error)
    }
  },

  async getBalance(args: {
    profile?: string
    allProfiles?: boolean
    accountNumber?: string
    accountNumbers?: string[]
    allAccounts?: boolean
  }) {
    try {
      const structuredContent = await queryBalances({
        selector: normalizeProfileSelector(args),
        accountNumbers: getAccountNumbers(args),
        allAccounts: args.allAccounts === true,
      })
      return successResult(structuredContent)
    } catch (error) {
      return errorResult(error)
    }
  },

  async getUsage(args: {
    profile?: string
    allProfiles?: boolean
    accountNumber?: string
    accountNumbers?: string[]
    allAccounts?: boolean
    year: number
    month: number
  }) {
    try {
      const structuredContent = await queryUsage({
        selector: normalizeProfileSelector(args),
        accountNumbers: getAccountNumbers(args),
        allAccounts: args.allAccounts === true,
        year: args.year,
        month: args.month,
      })
      return successResult(structuredContent)
    } catch (error) {
      return errorResult(error)
    }
  },

  async verifySession(args: unknown) {
    try {
      const structuredContent = await verifyStoredProfiles(normalizeProfileSelector(args))
      return {
        ...successResult(structuredContent),
        isError: structuredContent.profiles.some((profile) => !profile.valid),
      }
    } catch (error) {
      return errorResult(error)
    }
  },
}

export function createMcpServer() {
  const server = new McpServer({
    name: "china-southern-power-grid",
    version: "1.0.0",
  })

  server.registerTool(
    "list_profiles",
    {
      description: "列出 Next.js 本地数据库中已配置的南方电网用户配置",
      inputSchema: {},
      outputSchema: {
        profiles: z.array(profileSchema),
      },
      annotations: readOnlyAnnotations,
    },
    mcpHandlers.listProfiles
  )

  server.registerTool(
    "get_electricity_accounts",
    {
      description: "列出默认用户配置、指定用户配置或全部用户配置下的电表账户",
      inputSchema: profileInputSchema,
      outputSchema: {
        accounts: z.array(accountSchema),
        errors: z.array(queryErrorSchema),
      },
      annotations: readOnlyAnnotations,
    },
    mcpHandlers.listAccounts
  )

  server.registerTool(
    "get_balance",
    {
      description: "查询所选用户配置下一个电表、多个电表或全部电表的余额与欠费",
      inputSchema: accountSelectionSchema,
      outputSchema: {
        balances: z.array(balanceSchema),
        errors: z.array(queryErrorSchema),
      },
      annotations: readOnlyAnnotations,
    },
    mcpHandlers.getBalance
  )

  server.registerTool(
    "get_usage",
    {
      description: "查询所选用户配置下一个电表、多个电表或全部电表的月度用电详情",
      inputSchema: {
        ...accountSelectionSchema,
        year: z.number().int().describe("查询年份，例如 2026"),
        month: z.number().int().describe("查询月份，取值 1 到 12"),
      },
      outputSchema: {
        usages: z.array(usageSchema),
        errors: z.array(queryErrorSchema),
      },
      annotations: readOnlyAnnotations,
    },
    mcpHandlers.getUsage
  )

  server.registerTool(
    "verify_session",
    {
      description: "验证默认用户配置、指定用户配置或全部用户配置的会话状态",
      inputSchema: profileInputSchema,
      outputSchema: {
        profiles: z.array(verifyProfileSchema),
      },
      annotations: readOnlyAnnotations,
    },
    mcpHandlers.verifySession
  )

  return server
}
