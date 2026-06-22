import { z } from "zod"

export function validateProfileAlias(alias: string): string {
  const value = alias.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value)) {
    throw new Error("用户配置别名必须以字母或数字开头，且只能包含字母、数字、点号、下划线或短横线。")
  }
  return value
}

export function validateAccountNumber(accountNumber: string): string {
  const value = String(accountNumber || "").trim()
  if (!/^\d{10,20}$/.test(value)) {
    throw new Error("缴费户号必须是 10 到 20 位数字字符串。")
  }
  return value
}

export function validateYear(year: number): number {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("年份必须是 2000 到 2100 之间的 4 位整数。")
  }
  return year
}

export function validateMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("月份必须是 1 到 12 之间的整数。")
  }
  return month
}

export const profileSelectorSchema = z.object({
  profile: z.string().optional(),
  allProfiles: z.coerce.boolean().optional(),
})

export const accountSelectionSchema = profileSelectorSchema.extend({
  accountNumber: z.string().optional(),
  accountNumbers: z.array(z.string()).optional(),
  allAccounts: z.coerce.boolean().optional(),
})

export function normalizeProfileSelector(input: unknown) {
  const parsed = profileSelectorSchema.parse(input || {})
  return {
    profile: parsed.profile ? validateProfileAlias(parsed.profile) : undefined,
    allProfiles: parsed.allProfiles === true,
  }
}

export function getAccountNumbers(input: {
  accountNumber?: string
  accountNumbers?: string[]
}) {
  return [
    ...(input.accountNumber ? [input.accountNumber] : []),
    ...(input.accountNumbers || []),
  ].map(validateAccountNumber)
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
