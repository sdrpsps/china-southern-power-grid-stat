import * as fs from "fs";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { CSGClient, QRCodeType } from "./csg-client.js";
const QR_SCAN_TIMEOUT_MS = 300000; // 5分钟
async function main() {
    const rl = readline.createInterface({ input, output });
    try {
        console.log("=== 南方电网 API 交互登录工具 ===");
        console.log("请选择登录方式：");
        console.log("1. 手机号 + 短信验证码");
        console.log("2. 手机号 + 密码 + 短信验证码");
        console.log("3. 扫码登录 (微信、支付宝、南网 APP)");
        const choice = (await rl.question("> ")).trim();
        const client = new CSGClient();
        if (choice === "1" || choice === "2") {
            const phoneNo = (await rl.question("请输入手机号: ")).trim();
            if (!phoneNo) {
                console.error("手机号不能为空");
                return;
            }
            console.log("正在发送验证码...");
            await client.apiSendLoginSms(phoneNo);
            console.log("验证码已发送，请注意查收。");
            let password = "";
            if (choice === "2") {
                password = await rl.question("请输入登录密码: ");
            }
            const code = (await rl.question("请输入短信验证码: ")).trim();
            if (!code) {
                console.error("验证码不能为空");
                return;
            }
            console.log("正在登录...");
            let authToken = "";
            if (choice === "1") {
                authToken = await client.apiLoginWithSmsCode(phoneNo, code);
            }
            else {
                authToken = await client.apiLoginWithPasswordAndSmsCode(phoneNo, password, code);
            }
            client.authToken = authToken;
        }
        else if (choice === "3") {
            console.log("请选择扫码渠道：");
            console.log("1. 微信");
            console.log("2. 支付宝");
            console.log("3. 南网 APP");
            const qrChoice = (await rl.question("> ")).trim();
            let channel;
            if (qrChoice === "1") {
                channel = QRCodeType.QR_WECHAT;
            }
            else if (qrChoice === "2") {
                channel = QRCodeType.QR_ALIPAY;
            }
            else if (qrChoice === "3") {
                channel = QRCodeType.QR_CSG;
            }
            else {
                console.error("无效选择");
                return;
            }
            console.log("正在生成登录二维码链接...");
            const { loginId, qrUrl } = await client.apiCreateLoginQrCode(channel);
            console.log(`\n请在浏览器中打开以下链接，扫码登录:\n\n${qrUrl}\n`);
            console.log("正在轮询扫码状态，请尽快扫码...");
            const startTime = Date.now();
            let isSuccess = false;
            while (Date.now() - startTime < QR_SCAN_TIMEOUT_MS) {
                const status = await client.apiGetQrLoginStatus(loginId);
                if (status.success) {
                    client.authToken = status.authToken;
                    isSuccess = true;
                    console.log("扫码登录成功！");
                    break;
                }
                // 每秒检查一次
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            if (!isSuccess) {
                console.error("扫码超时，请重新运行程序");
                return;
            }
        }
        else {
            console.error("无效的选择");
            return;
        }
        console.log("正在初始化客户端，验证登录态并获取用户信息...");
        await client.initialize();
        console.log("客户端初始化完成！");
        const sessionData = client.dump();
        await fs.promises.writeFile("session.json", JSON.stringify(sessionData, null, 2), "utf-8");
        console.log("=== 登录成功 ===");
        console.log("登录态已成功保存至 session.json 文件。");
    }
    catch (error) {
        console.error("登录失败:", error?.message || error);
    }
    finally {
        rl.close();
    }
}
main();
