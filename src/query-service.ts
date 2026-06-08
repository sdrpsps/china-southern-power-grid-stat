import type { CSGElectricityAccount } from "./csg-client.js";
import {
  CSGProfile,
  ProfileSelector,
  initializeClientForProfile,
  listProfiles as listStoredProfiles,
  resolveProfiles,
  validateAccountNumber,
  validateMonth,
  validateProfileAlias,
  validateYear,
} from "./profile.js";

export type PublicProfile = {
  alias: string;
  label?: string;
  sessionPath: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
};

export type QueryError = {
  profile: string;
  accountNumber?: string;
  error: string;
};

export type AccountRecord = {
  profile: string;
  accountNumber: string;
  areaCode: string;
  eleCustomerId: string;
  meteringPointId: string;
  meteringPointNumber: string;
  address: string;
  userName: string;
};

export type BalanceRecord = {
  profile: string;
  accountNumber: string;
  address: string;
  userName: string;
  balance: number;
  arrears: number;
};

export type UsageRecord = {
  profile: string;
  accountNumber: string;
  address: string;
  userName: string;
  year: number;
  month: number;
  monthTotalCost: number | null;
  monthTotalKwh: number | null;
  ladder: {
    ladder: number | null;
    startDate: string | null;
    remainingKwh: number | null;
    tariff: number | null;
  };
  dailyDetails: Array<{ date: string; charge: number; kwh: number }>;
};

export type VerifyRecord = {
  profile: string;
  valid: boolean;
  reason?: string;
};

function toPublicProfile(profile: CSGProfile): PublicProfile {
  return {
    alias: profile.alias,
    label: profile.label,
    sessionPath: profile.sessionPath,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    source: profile.source,
  };
}

function toAccountRecord(profile: CSGProfile, account: CSGElectricityAccount): AccountRecord {
  return {
    profile: profile.alias,
    accountNumber: account.accountNumber,
    areaCode: account.areaCode,
    eleCustomerId: account.eleCustomerId,
    meteringPointId: account.meteringPointId,
    meteringPointNumber: account.meteringPointNumber,
    address: account.address,
    userName: account.userName,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeProfileSelector(input: {
  profile?: unknown;
  allProfiles?: unknown;
  sessionPath?: unknown;
  skillDir?: string;
}): ProfileSelector {
  return {
    profile:
      typeof input.profile === "string" && input.profile.trim()
        ? validateProfileAlias(input.profile)
        : undefined,
    allProfiles:
      input.allProfiles === true ||
      input.allProfiles === "true" ||
      input.allProfiles === "1",
    sessionPath:
      typeof input.sessionPath === "string" && input.sessionPath.trim()
        ? input.sessionPath
        : undefined,
    skillDir: input.skillDir,
  };
}

export async function listProfiles(): Promise<{ profiles: PublicProfile[] }> {
  const profiles = await listStoredProfiles({ includeLegacy: true });
  return { profiles: profiles.map(toPublicProfile) };
}

export async function listAccounts(
  selector: ProfileSelector = {},
): Promise<{ accounts: AccountRecord[]; errors: QueryError[] }> {
  const profiles = await resolveProfiles(selector);
  const accounts: AccountRecord[] = [];
  const errors: QueryError[] = [];

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile);
      const profileAccounts = await client.getAllElectricityAccounts();
      accounts.push(...profileAccounts.map((account) => toAccountRecord(profile, account)));
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) });
    }
  }

  if (profiles.length === 1 && errors.length) {
    throw new Error(errors[0].error);
  }

  return { accounts, errors };
}

async function getProfileAccounts(profile: CSGProfile): Promise<CSGElectricityAccount[]> {
  const client = await initializeClientForProfile(profile);
  return client.getAllElectricityAccounts();
}

function selectAccounts(
  profile: CSGProfile,
  accounts: CSGElectricityAccount[],
  accountNumbers: string[] | undefined,
): Array<{ profile: CSGProfile; account: CSGElectricityAccount }> {
  if (!accountNumbers || accountNumbers.length === 0) {
    return accounts.map((account) => ({ profile, account }));
  }
  const selected: Array<{ profile: CSGProfile; account: CSGElectricityAccount }> = [];
  for (const accountNumber of accountNumbers) {
    const normalized = validateAccountNumber(accountNumber);
    const account = accounts.find((item) => item.accountNumber === normalized);
    if (!account) {
      throw new Error(`户号 ${normalized} 未绑定到用户配置 '${profile.alias}'。`);
    }
    selected.push({ profile, account });
  }
  return selected;
}

export async function queryBalances(options: {
  selector?: ProfileSelector;
  accountNumbers?: string[];
  allAccounts?: boolean;
}): Promise<{ balances: BalanceRecord[]; errors: QueryError[] }> {
  const requestedAccounts = options.allAccounts
    ? undefined
    : (options.accountNumbers || []).map(validateAccountNumber);

  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("除非 allAccounts 为 true，否则至少需要一个缴费户号。");
  }

  const profiles = await resolveProfiles(options.selector || {});
  const balances: BalanceRecord[] = [];
  const errors: QueryError[] = [];

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile);
      const accounts = await client.getAllElectricityAccounts();
      const selected = selectAccounts(profile, accounts, requestedAccounts);
      for (const { account } of selected) {
        try {
          const balance = await client.getBalanceAndArrears(account);
          balances.push({
            profile: profile.alias,
            accountNumber: account.accountNumber,
            address: account.address,
            userName: account.userName,
            balance: balance.balance,
            arrears: balance.arrears,
          });
        } catch (error) {
          errors.push({
            profile: profile.alias,
            accountNumber: account.accountNumber,
            error: getErrorMessage(error),
          });
        }
      }
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) });
    }
  }

  if (profiles.length === 1 && balances.length === 0 && errors.length) {
    throw new Error(errors[0].error);
  }

  return { balances, errors };
}

export async function queryUsage(options: {
  selector?: ProfileSelector;
  accountNumbers?: string[];
  allAccounts?: boolean;
  year: number;
  month: number;
}): Promise<{ usages: UsageRecord[]; errors: QueryError[] }> {
  const year = validateYear(options.year);
  const month = validateMonth(options.month);
  const requestedAccounts = options.allAccounts
    ? undefined
    : (options.accountNumbers || []).map(validateAccountNumber);

  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("除非 allAccounts 为 true，否则至少需要一个缴费户号。");
  }

  const profiles = await resolveProfiles(options.selector || {});
  const usages: UsageRecord[] = [];
  const errors: QueryError[] = [];

  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile);
      const accounts = await client.getAllElectricityAccounts();
      const selected = selectAccounts(profile, accounts, requestedAccounts);
      for (const { account } of selected) {
        try {
          const usage = await client.getMonthDailyCostDetail(account, year, month);
          usages.push({
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
          });
        } catch (error) {
          errors.push({
            profile: profile.alias,
            accountNumber: account.accountNumber,
            error: getErrorMessage(error),
          });
        }
      }
    } catch (error) {
      errors.push({ profile: profile.alias, error: getErrorMessage(error) });
    }
  }

  if (profiles.length === 1 && usages.length === 0 && errors.length) {
    throw new Error(errors[0].error);
  }

  return { usages, errors };
}

export async function verifySessions(
  selector: ProfileSelector = {},
): Promise<{ profiles: VerifyRecord[] }> {
  const profiles = await resolveProfiles(selector);
  const results: VerifyRecord[] = [];
  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile);
      const valid = await client.verifyLogin();
      results.push({
        profile: profile.alias,
        valid,
        reason: valid ? undefined : "upstream-rejected",
      });
    } catch (error) {
      results.push({
        profile: profile.alias,
        valid: false,
        reason: getErrorMessage(error),
      });
    }
  }
  return { profiles: results };
}
