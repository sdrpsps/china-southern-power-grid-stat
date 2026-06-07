import * as fs from "fs";
import * as path from "path";
import { CSGClient } from "./csg-client.js";

const SESSION_FILE_PATH = path.resolve(process.cwd(), "session.json");

function getArgValue(argName: string): string | null {
  const arg = process.argv.find((a) => a.startsWith(`--${argName}=`));
  return arg ? arg.split("=")[1] : null;
}

async function getInitializedClient(): Promise<CSGClient> {
  if (!fs.existsSync(SESSION_FILE_PATH)) {
    throw new Error(
      "未找到 session.json，请先运行 `pnpm run login` 完成登录。",
    );
  }
  const sessionContent = await fs.promises.readFile(SESSION_FILE_PATH, "utf-8");
  const sessionData = JSON.parse(sessionContent);
  const client = CSGClient.load(sessionData);
  await client.initialize();
  return client;
}

async function main() {
  const action = getArgValue("action");

  if (!action) {
    console.error("错误: 缺少 --action 参数。例如: --action=accounts");
    process.exit(1);
  }

  try {
    const client = await getInitializedClient();

    if (action === "accounts") {
      const accounts = await client.getAllElectricityAccounts();
      const formatted = accounts.map((acc) => acc.dump());
      console.log(JSON.stringify(formatted, null, 2));
      process.exit(0);
    }

    if (action === "balance") {
      const accountNo = getArgValue("account");
      if (!accountNo) {
        console.error("错误: 缺少 --account 参数");
        process.exit(1);
      }
      const accounts = await client.getAllElectricityAccounts();
      const target = accounts.find((acc) => acc.accountNumber === accountNo);
      if (!target) {
        throw new Error(`未找到缴费户号为 ${accountNo} 的账户`);
      }
      const balanceData = await client.getBalanceAndArrears(target);
      console.log(
        JSON.stringify(
          {
            accountNumber: target.accountNumber,
            address: target.address,
            userName: target.userName,
            balance: balanceData.balance,
            arrears: balanceData.arrears,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    }

    if (action === "usage") {
      const accountNo = getArgValue("account");
      const yearStr = getArgValue("year");
      const monthStr = getArgValue("month");

      if (!accountNo || !yearStr || !monthStr) {
        console.error("错误: 缺少 --account、--year 或 --month 参数");
        process.exit(1);
      }

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const accounts = await client.getAllElectricityAccounts();
      const target = accounts.find((acc) => acc.accountNumber === accountNo);
      if (!target) {
        throw new Error(`未找到缴费户号为 ${accountNo} 的账户`);
      }

      const usageData = await client.getMonthDailyCostDetail(
        target,
        year,
        month,
      );
      console.log(
        JSON.stringify(
          {
            accountNumber: target.accountNumber,
            address: target.address,
            userName: target.userName,
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
      );
      process.exit(0);
    }

    console.error(`错误: 未知的 action: ${action}`);
    process.exit(1);
  } catch (error: any) {
    console.error(JSON.stringify({ error: error?.message || error }));
    process.exit(1);
  }
}

main();
