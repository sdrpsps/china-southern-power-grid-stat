import {
  listAccounts,
  listProfiles,
  normalizeProfileSelector,
  queryBalances,
  queryUsage,
  verifySessions,
} from "./query-service.js";

function getArgValues(argName: string): string[] {
  const prefix = `--${argName}=`;
  return process.argv
    .filter((arg) => arg.startsWith(prefix))
    .map((arg) => arg.slice(prefix.length))
    .filter(Boolean);
}

function getArgValue(argName: string): string | null {
  return getArgValues(argName)[0] || null;
}

function hasFlag(argName: string): boolean {
  return process.argv.includes(`--${argName}`);
}

function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

function printJsonError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: message }));
}

function getSelectorArgs() {
  return normalizeProfileSelector({
    profile: getArgValue("profile") || undefined,
    allProfiles: hasFlag("all-profiles") || getArgValue("all-profiles") || undefined,
    sessionPath: getArgValue("session") || undefined,
  });
}

function getAccountNumbers(): string[] {
  return [...getArgValues("account"), ...getArgValues("account-number")];
}

async function main() {
  const action = getArgValue("action");

  if (!action) {
    printJsonError("缺少 --action 参数。例如：--action=accounts");
    process.exit(1);
  }

  try {
    if (action === "profiles") {
      printJson(await listProfiles());
      process.exit(0);
    }

    if (action === "accounts") {
      const result = await listAccounts(getSelectorArgs());
      printJson(result.errors.length ? result : result.accounts);
      process.exit(0);
    }

    if (action === "verify" || action === "verify_session") {
      const result = await verifySessions(getSelectorArgs());
      printJson(result);
      process.exit(result.profiles.every((profile) => profile.valid) ? 0 : 1);
    }

    if (action === "balance") {
      const result = await queryBalances({
        selector: getSelectorArgs(),
        accountNumbers: getAccountNumbers(),
        allAccounts: hasFlag("all-accounts"),
      });
      if (result.errors.length || result.balances.length !== 1) {
        printJson(result);
      } else {
        printJson(result.balances[0]);
      }
      process.exit(result.errors.length && result.balances.length === 0 ? 1 : 0);
    }

    if (action === "usage") {
      const yearStr = getArgValue("year");
      const monthStr = getArgValue("month");

      if (!yearStr || !monthStr) {
        throw new Error("缺少 --year 或 --month 参数。");
      }

      const result = await queryUsage({
        selector: getSelectorArgs(),
        accountNumbers: getAccountNumbers(),
        allAccounts: hasFlag("all-accounts"),
        year: Number.parseInt(yearStr, 10),
        month: Number.parseInt(monthStr, 10),
      });

      if (result.errors.length || result.usages.length !== 1) {
        printJson(result);
      } else {
        printJson(result.usages[0]);
      }
      process.exit(result.errors.length && result.usages.length === 0 ? 1 : 0);
    }

    throw new Error(`未知 action：${action}`);
  } catch (error) {
    printJsonError(error);
    process.exit(1);
  }
}

main();
