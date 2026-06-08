import * as readline from "readline";
import * as readlinePromises from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { CSGClient, QRCodeType } from "./csg-client.js";
import { saveSessionForProfile, validateProfileAlias } from "./profile.js";

const QR_SCAN_TIMEOUT_MS = 300000; // 5 分钟

function getArgValue(argName: string): string | null {
  const prefix = `--${argName}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function hasFlag(argName: string): boolean {
  return process.argv.includes(`--${argName}`);
}

function emitAgentEvent(enabled: boolean, event: string, data: Record<string, any> = {}) {
  if (enabled) {
    console.log(JSON.stringify({ event, ...data }));
  }
}

async function askHiddenQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const mutableRl = rl as readline.Interface & {
    _writeToOutput?: (value: string) => void;
  };
  const originalWrite = mutableRl._writeToOutput;
  mutableRl._writeToOutput = (value: string) => {
    if (value.endsWith("\n") || value.endsWith("\r\n")) {
      output.write(value);
    } else {
      output.write("*");
    }
  };

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      mutableRl._writeToOutput = originalWrite;
      output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

function parseMethodChoice(choice: string): "sms" | "password-sms" | "qr" | null {
  if (choice === "1" || choice === "sms") return "sms";
  if (choice === "2" || choice === "password-sms") return "password-sms";
  if (choice === "3" || choice === "qr") return "qr";
  return null;
}

function parseQrChannel(choice: string): QRCodeType | null {
  if (choice === "1" || choice === "wechat") return QRCodeType.QR_WECHAT;
  if (choice === "2" || choice === "alipay") return QRCodeType.QR_ALIPAY;
  if (choice === "3" || choice === "csg") return QRCodeType.QR_CSG;
  return null;
}

async function main() {
  const agentMode = hasFlag("agent") || hasFlag("json");
  const rl = readlinePromises.createInterface({ input, output });

  try {
    if (!agentMode) {
      console.log("=== 南方电网接口交互登录工具 ===");
    }

    const requestedAlias = getArgValue("profile");
    const alias = validateProfileAlias(
      requestedAlias ||
        (await rl.question("请输入要创建或更新的本地用户配置别名（默认 default）: ")).trim() ||
        "default",
    );

    emitAgentEvent(agentMode, "profile_selected", { profile: alias });

    const methodArg = getArgValue("method");
    let method = methodArg ? parseMethodChoice(methodArg) : null;
    if (!method) {
      console.log("请选择登录方式：");
      console.log("1. 手机号 + 短信验证码");
      console.log("2. 手机号 + 密码 + 短信验证码");
      console.log("3. 扫码登录（微信、支付宝、南网应用）");
      method = parseMethodChoice((await rl.question("> ")).trim());
    }

    if (!method) {
      throw new Error("无效的登录方式");
    }

    const client = new CSGClient();

    if (method === "sms" || method === "password-sms") {
      const phoneNo =
        getArgValue("phone") || (await rl.question("请输入手机号：")).trim();
      if (!phoneNo) {
        throw new Error("手机号不能为空");
      }

      emitAgentEvent(agentMode, "sms_requesting", { profile: alias });
      console.log("正在发送验证码...");
      await client.apiSendLoginSms(phoneNo);
      emitAgentEvent(agentMode, "sms_sent", { profile: alias });
      console.log("验证码已发送，请注意查收。");

      let password = "";
      if (method === "password-sms") {
        password = getArgValue("password") || (await askHiddenQuestion("请输入登录密码："));
      }

      const code = getArgValue("code") || (await rl.question("请输入短信验证码：")).trim();
      if (!code) {
        throw new Error("验证码不能为空");
      }

      emitAgentEvent(agentMode, "login_submitting", { profile: alias, method });
      const authToken =
        method === "sms"
          ? await client.apiLoginWithSmsCode(phoneNo, code)
          : await client.apiLoginWithPasswordAndSmsCode(phoneNo, password, code);
      client.authToken = authToken;
    } else if (method === "qr") {
      let channel = parseQrChannel(getArgValue("qr-channel") || "");
      if (!channel) {
        console.log("请选择扫码渠道：");
        console.log("1. 微信");
        console.log("2. 支付宝");
        console.log("3. 南网应用");
        channel = parseQrChannel((await rl.question("> ")).trim());
      }
      if (!channel) {
        throw new Error("无效的扫码渠道");
      }

      emitAgentEvent(agentMode, "qr_creating", { profile: alias });
      console.log("正在生成登录二维码链接...");
      const { loginId, qrUrl } = await client.apiCreateLoginQrCode(channel);
      emitAgentEvent(agentMode, "qr_created", { profile: alias, qrUrl });
      console.log(`\n请在浏览器中打开以下链接，扫码登录：\n\n${qrUrl}\n`);

      console.log("正在轮询扫码状态，请尽快扫码...");
      const startTime = Date.now();
      let isSuccess = false;

      while (Date.now() - startTime < QR_SCAN_TIMEOUT_MS) {
        const status = await client.apiGetQrLoginStatus(loginId);
        if (status.success) {
          client.authToken = status.authToken;
          isSuccess = true;
          emitAgentEvent(agentMode, "qr_authorized", { profile: alias });
          console.log("扫码登录成功！");
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!isSuccess) {
        emitAgentEvent(agentMode, "qr_timeout", { profile: alias });
        throw new Error("扫码超时，请重新运行程序");
      }
    }

    emitAgentEvent(agentMode, "session_validating", { profile: alias });
    console.log("正在初始化客户端，验证登录态并获取用户信息...");
    await client.initialize();
    const isValid = await client.verifyLogin();
    if (!isValid) {
      throw new Error("登录态验证失败，请重新登录");
    }
    console.log("客户端初始化完成！");

    const profile = await saveSessionForProfile({
      alias,
      sessionData: client.dump(),
      setDefault: !getArgValue("no-default") && !hasFlag("no-default"),
    });

    emitAgentEvent(agentMode, "login_success", {
      profile: profile.alias,
      sessionPath: profile.sessionPath,
    });
    console.log("=== 登录成功 ===");
    console.log(`登录态已保存至用户配置 '${profile.alias}'。`);
    console.log(`会话文件: ${profile.sessionPath}`);
  } catch (error: any) {
    emitAgentEvent(agentMode, "login_failed", {
      error: error?.message || String(error),
    });
    console.error("登录失败：", error?.message || error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
