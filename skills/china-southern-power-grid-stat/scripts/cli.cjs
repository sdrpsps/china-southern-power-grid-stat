"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod,
  )
);

// src/cli.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);

// src/csg-client.ts
var crypto = __toESM(require("crypto"), 1);

// src/consts.ts
var BASE_PATH_WEB = "https://95598.csg.cn/ucs/ma/wt/";
var BASE_PATH_APP = "https://95598.csg.cn/ucs/ma/zt/";
var PARAM_KEY = "cOdHFNHUNkZrjNaN";
var PARAM_IV = "oMChoRLZnTivcQyR";
var LOGON_CHANNEL_HANDHELD_HALL = "4";
var RESP_STA_SUCCESS = "00";
var RESP_STA_QR_NOT_SCANNED = "09";
var AREACODE_FALLBACK = "030000";
var CREDENTIAL_PUBKEY =
  "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD1RJE6GBKJlFQvTU6g0ws9R+qXFccKl4i1Rf4KVR8Rh3XtlBtvBxEyTxnVT294RVvYz6THzHGQwREnlgdkjZyGBf7tmV2CgwaHF+ttvupuzOmRVQ/difIJtXKM+SM0aCOqBk0fFaLiHrZlZS4qI2/rBQN8VBoVKfGinVMM+USswwIDAQAB";
var LOGIN_TYPE_PHONE_CODE = "11";
var LOGIN_TYPE_PHONE_PWD_CODE = "1011";
var SEND_MSG_TYPE_VERIFICATION_CODE = "1";
var VERIFICATION_CODE_TYPE_LOGIN = "1";
var HEADER_X_AUTH_TOKEN = "x-auth-token";
var HEADER_CUST_NUMBER = "custNumber";
var JSON_KEY_STA = "sta";
var JSON_KEY_MESSAGE = "message";
var JSON_KEY_CUST_NUMBER = "custNumber";
var JSON_KEY_DATA = "data";
var JSON_KEY_LOGON_CHAN = "logonChan";
var JSON_KEY_SMS_CODE = "code";
var JSON_KEY_CRED_TYPE = "credType";
var JSON_KEY_AREA_CODE = "areaCode";
var JSON_KEY_PARAM = "param";
var JSON_KEY_ACCT_ID = "acctId";
var JSON_KEY_ELE_CUST_ID = "eleCustId";
var JSON_KEY_METERING_POINT_ID = "meteringPointId";
var JSON_KEY_METERING_POINT_NUMBER = "meteringPointNumber";
var JSON_KEY_YEAR_MONTH = "yearMonth";

// src/csg-client.ts
function encryptCredential(password) {
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----
${CREDENTIAL_PUBKEY}
-----END PUBLIC KEY-----`;
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, "utf8"),
  );
  return encrypted.toString("base64");
}
function encryptParams(params) {
  const jsonStr = JSON.stringify(params);
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(PARAM_KEY, "utf8"),
    Buffer.from(PARAM_IV, "utf8"),
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
function generateQrLoginId() {
  const randStr = `${Date.now()}${Math.random()}`;
  return crypto.createHash("md5").update(randStr).digest("hex");
}
var CSGElectricityAccount = class _CSGElectricityAccount {
  accountNumber;
  areaCode;
  eleCustomerId;
  meteringPointId;
  meteringPointNumber;
  address;
  userName;
  constructor(options) {
    this.accountNumber = options.accountNumber;
    this.areaCode = options.areaCode;
    this.eleCustomerId = options.eleCustomerId;
    this.meteringPointId = options.meteringPointId;
    this.meteringPointNumber = options.meteringPointNumber;
    this.address = options.address;
    this.userName = options.userName;
  }
  dump() {
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
  static load(data) {
    return new _CSGElectricityAccount({
      accountNumber: data.account_number,
      areaCode: data.area_code,
      eleCustomerId: data.ele_customer_id,
      meteringPointId: data.metering_point_id,
      meteringPointNumber: data.metering_point_number || "",
      address: data.address,
      userName: data.user_name,
    });
  }
};
var CSGClient = class _CSGClient {
  authToken = null;
  customerNumber = null;
  constructor(authToken = null) {
    this.authToken = authToken;
  }
  /**
   * 发起 HTTP 请求
   */
  async makeRequest(path2, payload, options = {}) {
    const {
      withAuth = true,
      method = "POST",
      customHeaders = {},
      basePath = BASE_PATH_APP,
    } = options;
    const url = basePath + path2;
    const headers = {
      Host: "95598.csg.cn",
      "Content-Type": "application/json;charset=utf-8",
      Origin: "file://",
      [HEADER_X_AUTH_TOKEN]: "",
      "Accept-Encoding": "gzip, deflate",
      Connection: "keep-alive",
      Accept: "application/json, text/plain, */*",
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
    const fetchOptions = {
      method,
      headers,
    };
    if (method === "POST" && payload !== null) {
      fetchOptions.body = JSON.stringify(payload);
    }
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const text = await response.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error(
        `\u8FD4\u56DE\u6570\u636E\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u672A\u5305\u542B JSON: ${text}`,
      );
    }
    const jsonStr = text.substring(start, end + 1);
    const data = JSON.parse(jsonStr);
    return { headers: response.headers, data };
  }
  /**
   * 处理不成功的 API 响应
   */
  handleUnsuccessfulResponse(path2, responseData) {
    const sta = responseData[JSON_KEY_STA];
    const msg = responseData[JSON_KEY_MESSAGE] || "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`\u63A5\u53E3\u9519\u8BEF [${path2}] (sta=${sta}): ${msg}`);
  }
  // === 原始 API 请求 ===
  /**
   * 发送登录短信验证码
   */
  async apiSendLoginSms(phoneNo) {
    const path2 = "center/sendMsg";
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      phoneNumber: phoneNo,
      vcType: VERIFICATION_CODE_TYPE_LOGIN,
      msgType: SEND_MSG_TYPE_VERIFICATION_CODE,
    };
    const { data } = await this.makeRequest(path2, payload, {
      withAuth: false,
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return true;
    }
    this.handleUnsuccessfulResponse(path2, data);
    return false;
  }
  /**
   * 创建登录二维码
   */
  async apiCreateLoginQrCode(channel, loginId) {
    const path2 = "center/createLoginQrcode";
    const finalLoginId = loginId || generateQrLoginId();
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      channel: channel,
      lgoinId: finalLoginId,
      // 原 API 包含拼写错误
    };
    const { data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB,
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return { loginId: finalLoginId, qrUrl: data[JSON_KEY_DATA] };
    }
    this.handleUnsuccessfulResponse(path2, data);
    throw new Error("\u521B\u5EFA\u767B\u5F55\u4E8C\u7EF4\u7801\u5931\u8D25");
  }
  /**
   * 获取扫码登录状态
   */
  async apiGetQrLoginStatus(loginId) {
    const path2 = "center/getLoginInfo";
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      loginId: loginId,
    };
    const { headers, data } = await this.makeRequest(path2, payload, {
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
    this.handleUnsuccessfulResponse(path2, data);
    return { success: false, authToken: "" };
  }
  /**
   * 使用手机号和短信验证码登录
   */
  async apiLoginWithSmsCode(phoneNo, smsCode) {
    const path2 = "center/login";
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_CODE,
      [JSON_KEY_SMS_CODE]: smsCode,
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" },
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || "";
    }
    this.handleUnsuccessfulResponse(path2, data);
    throw new Error("\u77ED\u4FE1\u9A8C\u8BC1\u7801\u767B\u5F55\u5931\u8D25");
  }
  /**
   * 使用手机号、密码和短信验证码登录
   */
  async apiLoginWithPasswordAndSmsCode(phoneNo, password, smsCode) {
    const path2 = "center/loginByPwdAndMsg";
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_PWD_CODE,
      credentials: encryptCredential(password),
      [JSON_KEY_SMS_CODE]: smsCode,
      checkPwd: true,
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" },
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || "";
    }
    this.handleUnsuccessfulResponse(path2, data);
    throw new Error(
      "\u8D26\u53F7\u5BC6\u7801+\u77ED\u4FE1\u9A8C\u8BC1\u7801\u767B\u5F55\u5931\u8D25",
    );
  }
  /**
   * 验证身份状态接口
   */
  async apiQueryAuthenticationResult() {
    const path2 = "user/queryAuthenticationResult";
    const { data } = await this.makeRequest(path2, null);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 获取用户信息
   */
  async apiGetUserInfo() {
    const path2 = "user/getUserInfo";
    const { data } = await this.makeRequest(path2, null);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 获取账号绑定的用电户列表
   */
  async apiGetAllLinkedElectricityAccounts() {
    const path2 = "eleCustNumber/queryBindEleUsers";
    const { data } = await this.makeRequest(path2, {});
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA] || [];
    }
    this.handleUnsuccessfulResponse(path2, data);
    return [];
  }
  /**
   * 查询用电计量点（即表计点）
   */
  async apiGetMeteringPoint(areaCode, eleCustomerId) {
    const path2 = "charge/queryMeteringPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      eleCustNumberList: [
        {
          [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
          [JSON_KEY_AREA_CODE]: areaCode,
        },
      ],
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 获取账户电费余额与欠费
   */
  async apiQueryAccountSurplus(areaCode, eleCustomerId) {
    const path2 = "charge/queryUserAccountNumberSurplus";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 查询当月每日用电电量 (kWh)
   */
  async apiQueryDayElectricByMPoint(
    year,
    month,
    areaCode,
    eleCustomerId,
    meteringPointId,
  ) {
    const path2 = "charge/queryDayElectricByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 查询当月每日用电电费与电量详情
   */
  async apiQueryDayElectricChargeByMPoint(
    year,
    month,
    areaCode,
    eleCustomerId,
    meteringPointId,
  ) {
    const path2 = "charge/queryDayElectricChargeByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 获取年度统计数据
   */
  async apiGetFeeAnalyzeDetails(year, areaCode, eleCustomerId) {
    const path2 = "charge/getAnalyzeFeeDetails";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      electricityBillYear: year,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_METERING_POINT_ID]: null,
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  /**
   * 查询昨日用电量 (kWh)
   */
  async apiQueryDayElectricByMPointYesterday(areaCode, eleCustomerId) {
    const path2 = "charge/queryDayElectricByMPointYesterday";
    const payload = {
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_AREA_CODE]: areaCode,
    };
    const { data } = await this.makeRequest(path2, payload);
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return data[JSON_KEY_DATA];
    }
    this.handleUnsuccessfulResponse(path2, data);
  }
  // === 高层封装与实用方法 ===
  /**
   * 初始化客户端：拉取用户信息以获取 customerNumber
   */
  async initialize() {
    const userData = await this.apiGetUserInfo();
    this.customerNumber = userData[JSON_KEY_CUST_NUMBER];
  }
  /**
   * 验证当前会话的登录态是否有效
   */
  async verifyLogin() {
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
  dump() {
    return {
      auth_token: this.authToken,
    };
  }
  /**
   * 导入登录态
   */
  static load(data) {
    if (!data.auth_token) {
      throw new Error(
        "Session \u6570\u636E\u4E2D\u672A\u53D1\u73B0 auth_token",
      );
    }
    const client = new _CSGClient();
    client.authToken = data.auth_token;
    return client;
  }
  /**
   * 获得所有关联的电表账户
   */
  async getAllElectricityAccounts() {
    const accountsData = await this.apiGetAllLinkedElectricityAccounts();
    const result = [];
    for (const item of accountsData) {
      const meteringPointData = await this.apiGetMeteringPoint(
        item[JSON_KEY_AREA_CODE],
        item["bindingId"],
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
  async getBalanceAndArrears(account) {
    const data = await this.apiQueryAccountSurplus(
      account.areaCode,
      account.eleCustomerId,
    );
    if (!data || data.length === 0) {
      throw new Error(
        "\u65E0\u6CD5\u83B7\u53D6\u4F59\u989D\u4FE1\u606F\uFF0C\u63A5\u53E3\u8FD4\u56DE\u7A7A\u6570\u636E",
      );
    }
    return {
      balance: parseFloat(data[0]["balance"]),
      arrears: parseFloat(data[0]["arrears"]),
    };
  }
  /**
   * 获取指定用电账户在某月份的每日用电电费、电量、当前阶梯计费等信息
   */
  async getMonthDailyCostDetail(account, year, month) {
    try {
      const respData = await this.apiQueryDayElectricChargeByMPoint(
        year,
        month,
        account.areaCode,
        account.eleCustomerId,
        account.meteringPointId,
      );
      const byDay = (respData.result || []).map((dData) => ({
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
    } catch (error) {
      let cleanMsg = error.message || String(error);
      if (cleanMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
        cleanMsg = cleanMsg.split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0].trim();
      }
      console.warn(
        `[CSGClient] \u63A5\u53E3 apiQueryDayElectricChargeByMPoint \u51FA\u9519\uFF0C\u5C1D\u8BD5\u964D\u7EA7\u65B9\u6848\u3002\u9519\u8BEF: ${cleanMsg}`,
      );
      let monthTotalCost = null;
      let monthTotalKwh = null;
      const byDay = [];
      try {
        const feeDetails = await this.apiGetFeeAnalyzeDetails(
          year,
          account.areaCode,
          account.eleCustomerId,
        );
        const targetMonthStr = `${year}-${String(month).padStart(2, "0")}`;
        const matchedItem = (feeDetails.electricAndChargeList || []).find(
          (item) => item.yearMonth === targetMonthStr,
        );
        if (matchedItem) {
          monthTotalCost = matchedItem.actualTotalAmount
            ? parseFloat(matchedItem.actualTotalAmount)
            : null;
          monthTotalKwh = matchedItem.billingElectricity
            ? parseFloat(matchedItem.billingElectricity)
            : null;
        }
      } catch (feeError) {
        let cleanFeeMsg = feeError.message || String(feeError);
        if (cleanFeeMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
          cleanFeeMsg = cleanFeeMsg
            .split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0]
            .trim();
        }
        console.warn(
          `[CSGClient] \u964D\u7EA7\u65B9\u6848\u83B7\u53D6\u5E74\u5EA6\u6708\u5EA6\u5206\u6790\u8D26\u5355\u5931\u8D25: ${cleanFeeMsg}`,
        );
      }
      try {
        const dayElectric = await this.apiQueryDayElectricByMPoint(
          year,
          month,
          account.areaCode,
          account.eleCustomerId,
          account.meteringPointId,
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
      } catch (dayError) {
        let cleanDayMsg = dayError.message || String(dayError);
        if (cleanDayMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
          cleanDayMsg = cleanDayMsg
            .split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0]
            .trim();
        }
        console.warn(
          `[CSGClient] \u964D\u7EA7\u65B9\u6848\u83B7\u53D6\u6BCF\u65E5\u7528\u7535\u91CF\u5931\u8D25: ${cleanDayMsg}`,
        );
      }
      if (
        monthTotalCost === null &&
        monthTotalKwh === null &&
        byDay.length === 0
      ) {
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
};

// src/cli.ts
var SESSION_FILE_PATH = path.resolve(process.cwd(), "session.json");
function getArgValue(argName) {
  const arg = process.argv.find((a) => a.startsWith(`--${argName}=`));
  return arg ? arg.split("=")[1] : null;
}
async function getInitializedClient() {
  if (!fs.existsSync(SESSION_FILE_PATH)) {
    throw new Error(
      "\u672A\u627E\u5230 session.json\uFF0C\u8BF7\u5148\u8FD0\u884C `pnpm run login` \u5B8C\u6210\u767B\u5F55\u3002",
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
    console.error(
      "\u9519\u8BEF: \u7F3A\u5C11 --action \u53C2\u6570\u3002\u4F8B\u5982: --action=accounts",
    );
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
        console.error("\u9519\u8BEF: \u7F3A\u5C11 --account \u53C2\u6570");
        process.exit(1);
      }
      const accounts = await client.getAllElectricityAccounts();
      const target = accounts.find((acc) => acc.accountNumber === accountNo);
      if (!target) {
        throw new Error(
          `\u672A\u627E\u5230\u7F34\u8D39\u6237\u53F7\u4E3A ${accountNo} \u7684\u8D26\u6237`,
        );
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
        console.error(
          "\u9519\u8BEF: \u7F3A\u5C11 --account\u3001--year \u6216 --month \u53C2\u6570",
        );
        process.exit(1);
      }
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const accounts = await client.getAllElectricityAccounts();
      const target = accounts.find((acc) => acc.accountNumber === accountNo);
      if (!target) {
        throw new Error(
          `\u672A\u627E\u5230\u7F34\u8D39\u6237\u53F7\u4E3A ${accountNo} \u7684\u8D26\u6237`,
        );
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
    console.error(`\u9519\u8BEF: \u672A\u77E5\u7684 action: ${action}`);
    process.exit(1);
  } catch (error) {
    console.error(JSON.stringify({ error: error?.message || error }));
    process.exit(1);
  }
}
main();
