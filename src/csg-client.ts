import * as crypto from "crypto";
import {
  BASE_PATH_APP,
  BASE_PATH_WEB,
  PARAM_KEY,
  PARAM_IV,
  CREDENTIAL_PUBKEY,
  HEADER_X_AUTH_TOKEN,
  HEADER_CUST_NUMBER,
  JSON_KEY_STA,
  JSON_KEY_MESSAGE,
  JSON_KEY_DATA,
  JSON_KEY_CUST_NUMBER,
  AREACODE_FALLBACK,
  VERIFICATION_CODE_TYPE_LOGIN,
  SEND_MSG_TYPE_VERIFICATION_CODE,
  RESP_STA_SUCCESS,
  RESP_STA_QR_NOT_SCANNED,
  JSON_KEY_AREA_CODE,
  JSON_KEY_ACCT_ID,
  JSON_KEY_LOGON_CHAN,
  LOGON_CHANNEL_HANDHELD_HALL,
  JSON_KEY_CRED_TYPE,
  LOGIN_TYPE_PHONE_CODE,
  JSON_KEY_SMS_CODE,
  JSON_KEY_PARAM,
  LOGIN_TYPE_PHONE_PWD_CODE,
  JSON_KEY_ELE_CUST_ID,
  JSON_KEY_METERING_POINT_ID,
  JSON_KEY_METERING_POINT_NUMBER,
  JSON_KEY_YEAR_MONTH,
  QRCodeType,
} from "./consts.js";

export { QRCodeType };

// 加密/解密辅助函数

/**
 * 使用 RSA 公钥加密用户密码
 */
export function encryptCredential(password: string): string {
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${CREDENTIAL_PUBKEY}\n-----END PUBLIC KEY-----`;
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, "utf8")
  );
  return encrypted.toString("base64");
}

/**
 * 使用 AES-128-CBC 加密参数（Zero Padding）
 */
export function encryptParams(params: Record<string, any>): string {
  const jsonStr = JSON.stringify(params);
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(PARAM_KEY, "utf8"),
    Buffer.from(PARAM_IV, "utf8")
  );
  cipher.setAutoPadding(false);

  let buf = Buffer.from(jsonStr, "utf8");
  const padLen = 16 - (buf.length % 16);
  if (padLen > 0) {
    buf = Buffer.concat([buf, Buffer.alloc(padLen, 0)]);
  }

  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
  return encrypted.toString("base64");
}

/**
 * 使用 AES-128-CBC 解密响应参数（去除 Zero Padding）
 */
export function decryptParams(encryptedStr: string): Record<string, any> {
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(PARAM_KEY, "utf8"),
    Buffer.from(PARAM_IV, "utf8")
  );
  decipher.setAutoPadding(false);

  const encryptedBuf = Buffer.from(encryptedStr, "base64");
  let decrypted = Buffer.concat([
    decipher.update(encryptedBuf),
    decipher.final(),
  ]);

  // 去除末尾的零字节填充
  let len = decrypted.length;
  while (len > 0 && decrypted[len - 1] === 0) {
    len--;
  }
  decrypted = decrypted.subarray(0, len);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * 随机生成扫码登录 ID
 */
function generateQrLoginId(): string {
  const randStr = `${Date.now()}${Math.random()}`;
  return crypto.createHash("md5").update(randStr).digest("hex");
}

/**
 * 电网账户类
 */
export class CSGElectricityAccount {
  accountNumber: string;
  areaCode: string;
  eleCustomerId: string;
  meteringPointId: string;
  meteringPointNumber: string;
  address: string;
  userName: string;

  constructor(options: {
    accountNumber: string;
    areaCode: string;
    eleCustomerId: string;
    meteringPointId: string;
    meteringPointNumber: string;
    address: string;
    userName: string;
  }) {
    this.accountNumber = options.accountNumber;
    this.areaCode = options.areaCode;
    this.eleCustomerId = options.eleCustomerId;
    this.meteringPointId = options.meteringPointId;
    this.meteringPointNumber = options.meteringPointNumber;
    this.address = options.address;
    this.userName = options.userName;
  }

  dump(): Record<string, string> {
    return {
      account_number: this.accountNumber,
      area_code: this.areaCode,
      ele_customer_id: this.eleCustomerId,
      metering_point_id: this.meteringPointId,
      metering_point_number: this.meteringPointNumber,
      address: this.address,
      user_name: this.userName,
    };
  }

  static load(data: Record<string, any>): CSGElectricityAccount {
    return new CSGElectricityAccount({
      accountNumber: data.account_number,
      areaCode: data.area_code,
      eleCustomerId: data.ele_customer_id,
      meteringPointId: data.metering_point_id,
      meteringPointNumber: data.metering_point_number || "",
      address: data.address,
      userName: data.user_name,
    });
  }
}

/**
 * 南方电网 API 客户端
 */
export class CSGClient {
  authToken: string | null = null;
  customerNumber: string | null = null;

  constructor(authToken: string | null = null) {
    this.authToken = authToken;
  }

  /**
   * 发起 HTTP 请求
   */
  private async makeRequest(
    path: string,
    payload: Record<string, any> | null,
    options: {
      withAuth?: boolean;
      method?: string;
      customHeaders?: Record<string, string>;
      basePath?: string;
    } = {}
  ): Promise<{ headers: Headers; data: any }> {
    const {
      withAuth = true,
      method = "POST",
      customHeaders = {},
      basePath = BASE_PATH_APP,
    } = options;

    const url = basePath + path;
    const headers: Record<string, string> = {
      "Host": "95598.csg.cn",
      "Content-Type": "application/json;charset=utf-8",
      "Origin": "file://",
      [HEADER_X_AUTH_TOKEN]: "",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Accept": "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      [HEADER_CUST_NUMBER]: "",
      "Accept-Language": "zh-CN,cn;q=0.9",
      ...customHeaders,
    };

    if (withAuth) {
      headers[HEADER_X_AUTH_TOKEN] = this.authToken || "";
      headers[HEADER_CUST_NUMBER] = this.customerNumber || "";
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST" && payload !== null) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP 请求失败：${response.status}`);
    }

    const text = await response.text();
    // 清理非 JSON 的包装字符
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error(`返回数据格式不正确，未包含 JSON: ${text}`);
    }
    const jsonStr = text.substring(start, end + 1);
    const data = JSON.parse(jsonStr);

    return { headers: response.headers, data };
  }

  /**
   * 处理不成功的接口响应
   */
  private handleUnsuccessfulResponse(path: string, responseData: any) {
    const sta = responseData[JSON_KEY_STA];
    const msg = responseData[JSON_KEY_MESSAGE] || "未知错误";
    throw new Error(`接口错误 [${path}] (sta=${sta}): ${msg}`);
  }

  // === 原始接口请求 ===

  /**
   * 发送登录短信验证码
   */
  async apiSendLoginSms(phoneNo: string): Promise<boolean> {
    const path = "center/sendMsg";
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      "phoneNumber": phoneNo,
      "vcType": VERIFICATION_CODE_TYPE_LOGIN,
      "msgType": SEND_MSG_TYPE_VERIFICATION_CODE,
    };
    const { data } = await this.makeRequest(path, payload, {
      withAuth: false,
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return true;
    }
    this.handleUnsuccessfulResponse(path, data);
    return false;
  }

  /**
   * 创建登录二维码
   */
  async apiCreateLoginQrCode(
    channel: QRCodeType,
    loginId?: string
  ): Promise<{ loginId: string; qrUrl: string }> {
    const path = "center/createLoginQrcode";
    const finalLoginId = loginId || generateQrLoginId();
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      "channel": channel,
      "lgoinId": finalLoginId, // 上游接口包含拼写错误
    };
    const { data } = await this.makeRequest(path, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB,
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return { loginId: finalLoginId, qrUrl: data[JSON_KEY_DATA] };
    }
    this.handleUnsuccessfulResponse(path, data);
    throw new Error("创建登录二维码失败");
  }

  /**
   * 获取扫码登录状态
   */
  async apiGetQrLoginStatus(
    loginId: string
  ): Promise<{ success: boolean; authToken: string }> {
    const path = "center/getLoginInfo";
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      "loginId": loginId,
    };
    const { headers, data } = await this.makeRequest(path, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB,
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return {
        success: true,
        authToken: headers.get(HEADER_X_AUTH_TOKEN) || "",
      };
    }
    if (data[JSON_KEY_STA] === RESP_STA_QR_NOT_SCANNED) {
      return { success: false, authToken: "" };
    }
    this.handleUnsuccessfulResponse(path, data);
    return { success: false, authToken: "" };
  }

  /**
   * 使用手机号和短信验证码登录
   */
  async apiLoginWithSmsCode(
    phoneNo: string,
    smsCode: string
  ): Promise<string> {
    const path = "center/login";
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_CODE,
      [JSON_KEY_SMS_CODE]: smsCode,
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" },
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || "";
    }
    this.handleUnsuccessfulResponse(path, data);
    throw new Error("短信验证码登录失败");
  }

  /**
   * 使用手机号、密码和短信验证码登录
   */
  async apiLoginWithPasswordAndSmsCode(
    phoneNo: string,
    password: string,
    smsCode: string
  ): Promise<string> {
    const path = "center/loginByPwdAndMsg";
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_PWD_CODE,
      "credentials": encryptCredential(password),
      [JSON_KEY_SMS_CODE]: smsCode,
      "checkPwd": true,
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" },
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || "";
    }
    this.handleUnsuccessfulResponse(path, data);
    throw new Error("账号密码+短信验证码登录失败");
  }

  /**
   * 验证身份状态接口
   */
  async apiQueryAuthenticationResult(): Promise<any> {
    const path = "user/queryAuthenticationResult";
    const { data } = await this.makeRequest(path, null);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 获取用户信息
   */
  async apiGetUserInfo(): Promise<any> {
    const path = "user/getUserInfo";
    const { data } = await this.makeRequest(path, null);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 获取账号绑定的用电户列表
   */
  async apiGetAllLinkedElectricityAccounts(): Promise<any[]> {
    const path = "eleCustNumber/queryBindEleUsers";
    const { data } = await this.makeRequest(path, {});
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA] || [];
    }
    this.handleUnsuccessfulResponse(path, data);
    return [];
  }

  /**
   * 查询用电计量点（即表计点）
   */
  async apiGetMeteringPoint(
    areaCode: string,
    eleCustomerId: string
  ): Promise<any> {
    const path = "charge/queryMeteringPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      "eleCustNumberList": [
        {
          [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
          [JSON_KEY_AREA_CODE]: areaCode,
        },
      ],
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 获取账户电费余额与欠费
   */
  async apiQueryAccountSurplus(
    areaCode: string,
    eleCustomerId: string
  ): Promise<any> {
    const path = "charge/queryUserAccountNumberSurplus";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 查询当月每日用电电量 (kWh)
   */
  async apiQueryDayElectricByMPoint(
    year: number,
    month: number,
    areaCode: string,
    eleCustomerId: string,
    meteringPointId: string
  ): Promise<any> {
    const path = "charge/queryDayElectricByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 查询当月每日用电电费与电量详情
   */
  async apiQueryDayElectricChargeByMPoint(
    year: number,
    month: number,
    areaCode: string,
    eleCustomerId: string,
    meteringPointId: string
  ): Promise<any> {
    const path = "charge/queryDayElectricChargeByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 获取年度统计数据
   */
  async apiGetFeeAnalyzeDetails(
    year: number,
    areaCode: string,
    eleCustomerId: string
  ): Promise<any> {
    const path = "charge/getAnalyzeFeeDetails";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      "electricityBillYear": year,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_METERING_POINT_ID]: null,
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  /**
   * 查询昨日用电量 (kWh)
   */
  async apiQueryDayElectricByMPointYesterday(
    areaCode: string,
    eleCustomerId: string
  ): Promise<any> {
    const path = "charge/queryDayElectricByMPointYesterday";
    const payload = {
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_AREA_CODE]: areaCode,
    };
    const { data } = await this.makeRequest(path, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path, data);
  }

  // === 高层封装与实用方法 ===

  /**
   * 初始化客户端：拉取用户信息以获取 customerNumber
   */
  async initialize(): Promise<void> {
    const userData = await this.apiGetUserInfo();
    this.customerNumber = userData[JSON_KEY_CUST_NUMBER];
  }

  /**
   * 验证当前会话的登录态是否有效
   */
  async verifyLogin(): Promise<boolean> {
    try {
      await this.apiQueryAuthenticationResult();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 导出登录态
   */
  dump(): Record<string, any> {
    return {
      auth_token: this.authToken,
    };
  }

  /**
   * 导入登录态
   */
  static load(data: Record<string, any>): CSGClient {
    if (!data.auth_token) {
      throw new Error("会话数据中未发现 auth_token");
    }
    const client = new CSGClient();
    client.authToken = data.auth_token;
    return client;
  }

  /**
   * 获得所有关联的电表账户
   */
  async getAllElectricityAccounts(): Promise<CSGElectricityAccount[]> {
    const accountsData = await this.apiGetAllLinkedElectricityAccounts();
    const result: CSGElectricityAccount[] = [];
    for (const item of accountsData) {
      const meteringPointData = await this.apiGetMeteringPoint(
        item[JSON_KEY_AREA_CODE],
        item["bindingId"]
      );
      if (!meteringPointData || meteringPointData.length === 0) {
        continue;
      }
      const meteringPointId = meteringPointData[0][JSON_KEY_METERING_POINT_ID];
      const meteringPointNumber =
        meteringPointData[0][JSON_KEY_METERING_POINT_NUMBER];
      const account = new CSGElectricityAccount({
        accountNumber: item["eleCustNumber"],
        areaCode: item[JSON_KEY_AREA_CODE],
        eleCustomerId: item["bindingId"],
        meteringPointId,
        meteringPointNumber,
        address: item["eleAddress"],
        userName: item["userName"],
      });
      result.push(account);
    }
    return result;
  }

  /**
   * 获取指定用电账户余额与欠费
   */
  async getBalanceAndArrears(
    account: CSGElectricityAccount
  ): Promise<{ balance: number; arrears: number }> {
    const data = await this.apiQueryAccountSurplus(
      account.areaCode,
      account.eleCustomerId
    );
    if (!data || data.length === 0) {
      throw new Error("无法获取余额信息，接口返回空数据");
    }
    return {
      balance: parseFloat(data[0]["balance"]),
      arrears: parseFloat(data[0]["arrears"]),
    };
  }

  /**
   * 获取指定用电账户在某月份的每日用电电费、电量、当前阶梯计费等信息
   */
  async getMonthDailyCostDetail(
    account: CSGElectricityAccount,
    year: number,
    month: number
  ): Promise<{
    monthTotalCost: number | null;
    monthTotalKwh: number | null;
    ladder: {
      ladder: number | null;
      startDate: string | null;
      remainingKwh: number | null;
      tariff: number | null;
    };
    byDay: Array<{ date: string; charge: number; kwh: number }>;
  }> {
    try {
      const respData = await this.apiQueryDayElectricChargeByMPoint(
        year,
        month,
        account.areaCode,
        account.eleCustomerId,
        account.meteringPointId
      );

      const byDay = (respData.result || []).map((dData: any) => ({
        date: dData.date,
        charge: parseFloat(dData.charge),
        kwh: parseFloat(dData.power),
      }));

      const monthTotalCost =
        respData.totalElectricity !== null
          ? parseFloat(respData.totalElectricity)
          : null;
      const monthTotalKwh =
        respData.totalPower !== null ? parseFloat(respData.totalPower) : null;

      const currentLadder =
        respData.ladderEle !== null ? parseInt(respData.ladderEle, 10) : null;
      const currentLadderStartDate = respData.ladderEleStartDate || null;

      const currentLadderRemainingKwh =
        respData.ladderEleSurplus !== null
          ? parseFloat(respData.ladderEleSurplus)
          : null;
      const currentTariff =
        respData.ladderEleTariff !== null
          ? parseFloat(respData.ladderEleTariff)
          : null;

      return {
        monthTotalCost,
        monthTotalKwh,
        ladder: {
          ladder: currentLadder,
          startDate: currentLadderStartDate,
          remainingKwh: currentLadderRemainingKwh,
          tariff: currentTariff,
        },
        byDay,
      };
    } catch (error: any) {
      let cleanMsg = error.message || String(error);
      if (cleanMsg.includes("查询语句：")) {
        cleanMsg = cleanMsg.split("查询语句：")[0].trim();
      }
      console.warn(`[CSGClient] 接口 apiQueryDayElectricChargeByMPoint 出错，尝试降级方案。错误: ${cleanMsg}`);
      
      let monthTotalCost: number | null = null;
      let monthTotalKwh: number | null = null;
      const byDay: Array<{ date: string; charge: number; kwh: number }> = [];

      try {
        const feeDetails = await this.apiGetFeeAnalyzeDetails(year, account.areaCode, account.eleCustomerId);
        const targetMonthStr = `${year}-${String(month).padStart(2, "0")}`;
        const matchedItem = (feeDetails.electricAndChargeList || []).find(
          (item: any) => item.yearMonth === targetMonthStr
        );
        if (matchedItem) {
          monthTotalCost = matchedItem.actualTotalAmount ? parseFloat(matchedItem.actualTotalAmount) : null;
          monthTotalKwh = matchedItem.billingElectricity ? parseFloat(matchedItem.billingElectricity) : null;
        }
      } catch (feeError: any) {
        let cleanFeeMsg = feeError.message || String(feeError);
        if (cleanFeeMsg.includes("查询语句：")) {
          cleanFeeMsg = cleanFeeMsg.split("查询语句：")[0].trim();
        }
        console.warn(`[CSGClient] 降级方案获取年度月度分析账单失败: ${cleanFeeMsg}`);
      }

      try {
        const dayElectric = await this.apiQueryDayElectricByMPoint(
          year,
          month,
          account.areaCode,
          account.eleCustomerId,
          account.meteringPointId
        );
        if (dayElectric && dayElectric.result) {
          for (const dData of dayElectric.result) {
            byDay.push({
              date: dData.date,
              charge: 0,
              kwh: dData.power ? parseFloat(dData.power) : 0,
            });
          }
          if (monthTotalKwh === null && dayElectric.totalPower) {
            monthTotalKwh = parseFloat(dayElectric.totalPower);
          }
        }
      } catch (dayError: any) {
        let cleanDayMsg = dayError.message || String(dayError);
        if (cleanDayMsg.includes("查询语句：")) {
          cleanDayMsg = cleanDayMsg.split("查询语句：")[0].trim();
        }
        console.warn(`[CSGClient] 降级方案获取每日用电量失败: ${cleanDayMsg}`);
      }

      if (monthTotalCost === null && monthTotalKwh === null && byDay.length === 0) {
        throw error;
      }

      return {
        monthTotalCost,
        monthTotalKwh,
        ladder: {
          ladder: null,
          startDate: null,
          remainingKwh: null,
          tariff: null,
        },
        byDay,
      };
    }
  }
}
