import type { CSGElectricityAccount } from "@/lib/csg/client"
import {
  initializeClientForProfile,
  resolveSessionProfiles,
} from "@/lib/services/profiles"
import {
  insertBalanceSnapshot,
  listAccountSnapshots,
  logOperation,
  upsertAccountSnapshot,
  upsertUsageSnapshot,
} from "@/lib/services/repositories"
import type {
  AccountRecord,
  BalanceRecord,
  ProfileSelector,
  QueryError,
  UsageRecord,
} from "@/lib/services/types"
import {
  getErrorMessage,
  validateAccountNumber,
  validateMonth,
  validateYear,
} from "@/lib/services/validation"

function toAccountRecord(profile: string, account: CSGElectricityAccount): AccountRecord {
  return {
    profile,
    accountNumber: account.accountNumber,
    areaCode: account.areaCode,
    eleCustomerId: account.eleCustomerId,
    meteringPointId: account.meteringPointId,
    meteringPointNumber: account.meteringPointNumber,
    address: account.address,
    userName: account.userName,
  }
}

export async function listAccounts(selector: ProfileSelector = {}) {
  const profiles = await resolveSessionProfiles(selector)
  const accounts: AccountRecord[] = []
  const errors: QueryError[] = []

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile)
      const profileAccounts = await client.getAllElectricityAccounts()
      for (const account of profileAccounts) {
        const record = toAccountRecord(profile.alias, account)
        accounts.push(record)
        await upsertAccountSnapshot(profile.id, record)
      }
      await logOperation({
        operation: "accounts.list",
        profileAlias: profile.alias,
        status: "success",
        summary: `刷新 ${profileAccounts.length} 个电表账户`,
      })
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) })
      await logOperation({
        operation: "accounts.list",
        profileAlias: profile.alias,
        status: "failure",
        error: getErrorMessage(error),
      })
    }
  }

  if (profiles.length === 1 && errors.length && accounts.length === 0) {
    throw new Error(errors[0].error)
  }
  return { accounts, errors }
}

function selectAccounts(
  profileAlias: string,
  accounts: CSGElectricityAccount[],
  accountNumbers: string[] | undefined
) {
  if (!accountNumbers || accountNumbers.length === 0) {
    return accounts
  }
  return accountNumbers.map((accountNumber) => {
    const normalized = validateAccountNumber(accountNumber)
    const account = accounts.find((item) => item.accountNumber === normalized)
    if (!account) {
      throw new Error(`户号 ${normalized} 未绑定到用户配置 '${profileAlias}'。`)
    }
    return account
  })
}

export async function queryBalances(options: {
  selector?: ProfileSelector
  accountNumbers?: string[]
  allAccounts?: boolean
}) {
  const requestedAccounts = options.allAccounts
    ? undefined
    : (options.accountNumbers || []).map(validateAccountNumber)
  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("除非 allAccounts 为 true，否则至少需要一个缴费户号。")
  }

  const profiles = await resolveSessionProfiles(options.selector || {})
  const balances: BalanceRecord[] = []
  const errors: QueryError[] = []

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile)
      const accounts = await client.getAllElectricityAccounts()
      const selected = selectAccounts(profile.alias, accounts, requestedAccounts)
      for (const account of selected) {
        try {
          const balance = await client.getBalanceAndArrears(account)
          const record = {
            profile: profile.alias,
            accountNumber: account.accountNumber,
            address: account.address,
            userName: account.userName,
            balance: balance.balance,
            arrears: balance.arrears,
            queriedAt: new Date().toISOString(),
          }
          balances.push(record)
          await insertBalanceSnapshot(profile.id, record)
        } catch (error) {
          errors.push({ profile: profile.alias, accountNumber: account.accountNumber, error: getErrorMessage(error) })
        }
      }
      await logOperation({ operation: "balances.query", profileAlias: profile.alias, status: "success" })
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) })
      await logOperation({ operation: "balances.query", profileAlias: profile.alias, status: "failure", error: getErrorMessage(error) })
    }
  }

  if (profiles.length === 1 && balances.length === 0 && errors.length) {
    throw new Error(errors[0].error)
  }
  return { balances, errors }
}

export async function queryUsage(options: {
  selector?: ProfileSelector
  accountNumbers?: string[]
  allAccounts?: boolean
  year: number
  month: number
}) {
  const year = validateYear(options.year)
  const month = validateMonth(options.month)
  const requestedAccounts = options.allAccounts
    ? undefined
    : (options.accountNumbers || []).map(validateAccountNumber)
  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("除非 allAccounts 为 true，否则至少需要一个缴费户号。")
  }

  const profiles = await resolveSessionProfiles(options.selector || {})
  const usages: UsageRecord[] = []
  const errors: QueryError[] = []

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile)
      const accounts = await client.getAllElectricityAccounts()
      const selected = selectAccounts(profile.alias, accounts, requestedAccounts)
      for (const account of selected) {
        try {
          const usage = await client.getMonthDailyCostDetail(account, year, month)
          const record: UsageRecord = {
            profile: profile.alias,
            accountNumber: account.accountNumber,
            address: account.address,
            userName: account.userName,
            year,
            month,
            monthTotalCost: usage.monthTotalCost,
            monthTotalKwh: usage.monthTotalKwh,
            ladder: usage.ladder,
            dailyDetails: usage.byDay,
            queriedAt: new Date().toISOString(),
          }
          usages.push(record)
          await upsertUsageSnapshot(profile.id, record)
        } catch (error) {
          errors.push({ profile: profile.alias, accountNumber: account.accountNumber, error: getErrorMessage(error) })
        }
      }
      await logOperation({ operation: "usage.query", profileAlias: profile.alias, status: "success" })
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) })
      await logOperation({ operation: "usage.query", profileAlias: profile.alias, status: "failure", error: getErrorMessage(error) })
    }
  }

  if (profiles.length === 1 && usages.length === 0 && errors.length) {
    throw new Error(errors[0].error)
  }
  return { usages, errors }
}

export async function getCachedAccounts(selector: ProfileSelector = {}) {
  const profiles = await resolveSessionProfiles(selector)
  const accounts: AccountRecord[] = []
  for (const profile of profiles) {
    const rows = await listAccountSnapshots(profile.id)
    accounts.push(
      ...rows.map((row) => ({
        profile: profile.alias,
        accountNumber: row.accountNumber,
        areaCode: row.areaCode,
        eleCustomerId: row.eleCustomerId,
        meteringPointId: row.meteringPointId,
        meteringPointNumber: row.meteringPointNumber,
        address: row.address,
        userName: row.userName,
        refreshedAt: row.refreshedAt,
      }))
    )
  }
  return { accounts, errors: [] as QueryError[] }
}
