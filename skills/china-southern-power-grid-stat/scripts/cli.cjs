"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/profile.ts
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
var CREDENTIAL_PUBKEY = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD1RJE6GBKJlFQvTU6g0ws9R+qXFccKl4i1Rf4KVR8Rh3XtlBtvBxEyTxnVT294RVvYz6THzHGQwREnlgdkjZyGBf7tmV2CgwaHF+ttvupuzOmRVQ/difIJtXKM+SM0aCOqBk0fFaLiHrZlZS4qI2/rBQN8VBoVKfGinVMM+USswwIDAQAB";
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
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    Buffer.from(password, "utf8")
  );
  return encrypted.toString("base64");
}
function encryptParams(params) {
  const jsonStr = JSON.stringify(params);
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(PARAM_KEY, "utf8"),
    Buffer.from(PARAM_IV, "utf8")
  );
  cipher.setAutoPadding(false);
  let buf = Buffer.from(jsonStr, "utf8");
  const padLen = 16 - buf.length % 16;
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
      user_name: this.userName
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
      userName: data.user_name
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
      basePath = BASE_PATH_APP
    } = options;
    const url = basePath + path2;
    const headers = {
      "Host": "95598.csg.cn",
      "Content-Type": "application/json;charset=utf-8",
      "Origin": "file://",
      [HEADER_X_AUTH_TOKEN]: "",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      [HEADER_CUST_NUMBER]: "",
      "Accept-Language": "zh-CN,cn;q=0.9",
      ...customHeaders
    };
    if (withAuth) {
      headers[HEADER_X_AUTH_TOKEN] = this.authToken || "";
      headers[HEADER_CUST_NUMBER] = this.customerNumber || "";
    }
    const fetchOptions = {
      method,
      headers
    };
    if (method === "POST" && payload !== null) {
      fetchOptions.body = JSON.stringify(payload);
    }
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP \u8BF7\u6C42\u5931\u8D25\uFF1A${response.status}`);
    }
    const text = await response.text();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error(`\u8FD4\u56DE\u6570\u636E\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u672A\u5305\u542B JSON: ${text}`);
    }
    const jsonStr = text.substring(start, end + 1);
    const data = JSON.parse(jsonStr);
    return { headers: response.headers, data };
  }
  /**
   * 处理不成功的接口响应
   */
  handleUnsuccessfulResponse(path2, responseData) {
    const sta = responseData[JSON_KEY_STA];
    const msg = responseData[JSON_KEY_MESSAGE] || "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`\u63A5\u53E3\u9519\u8BEF [${path2}] (sta=${sta}): ${msg}`);
  }
  // === 原始接口请求 ===
  /**
   * 发送登录短信验证码
   */
  async apiSendLoginSms(phoneNo) {
    const path2 = "center/sendMsg";
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      "phoneNumber": phoneNo,
      "vcType": VERIFICATION_CODE_TYPE_LOGIN,
      "msgType": SEND_MSG_TYPE_VERIFICATION_CODE
    };
    const { data } = await this.makeRequest(path2, payload, {
      withAuth: false
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
      "channel": channel,
      "lgoinId": finalLoginId
      // 上游接口包含拼写错误
    };
    const { data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB
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
      "loginId": loginId
    };
    const { headers, data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return {
        success: true,
        authToken: headers.get(HEADER_X_AUTH_TOKEN) || ""
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
      [JSON_KEY_SMS_CODE]: smsCode
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" }
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
      "credentials": encryptCredential(password),
      [JSON_KEY_SMS_CODE]: smsCode,
      "checkPwd": true
    };
    const payload = { [JSON_KEY_PARAM]: encryptParams(innerPayload) };
    const { headers, data } = await this.makeRequest(path2, payload, {
      withAuth: false,
      customHeaders: { "need-crypto": "true" }
    });
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || "";
    }
    this.handleUnsuccessfulResponse(path2, data);
    throw new Error("\u8D26\u53F7\u5BC6\u7801+\u77ED\u4FE1\u9A8C\u8BC1\u7801\u767B\u5F55\u5931\u8D25");
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
      "eleCustNumberList": [
        {
          [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
          [JSON_KEY_AREA_CODE]: areaCode
        }
      ]
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
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId
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
  async apiQueryDayElectricByMPoint(year, month, areaCode, eleCustomerId, meteringPointId) {
    const path2 = "charge/queryDayElectricByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId
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
  async apiQueryDayElectricChargeByMPoint(year, month, areaCode, eleCustomerId, meteringPointId) {
    const path2 = "charge/queryDayElectricChargeByMPoint";
    const payload = {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId
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
      "electricityBillYear": year,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_METERING_POINT_ID]: null
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
      [JSON_KEY_AREA_CODE]: areaCode
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
      auth_token: this.authToken
    };
  }
  /**
   * 导入登录态
   */
  static load(data) {
    if (!data.auth_token) {
      throw new Error("\u4F1A\u8BDD\u6570\u636E\u4E2D\u672A\u53D1\u73B0 auth_token");
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
        item["bindingId"]
      );
      if (!meteringPointData || meteringPointData.length === 0) {
        continue;
      }
      const meteringPointId = meteringPointData[0][JSON_KEY_METERING_POINT_ID];
      const meteringPointNumber = meteringPointData[0][JSON_KEY_METERING_POINT_NUMBER];
      const account = new CSGElectricityAccount({
        accountNumber: item["eleCustNumber"],
        areaCode: item[JSON_KEY_AREA_CODE],
        eleCustomerId: item["bindingId"],
        meteringPointId,
        meteringPointNumber,
        address: item["eleAddress"],
        userName: item["userName"]
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
      account.eleCustomerId
    );
    if (!data || data.length === 0) {
      throw new Error("\u65E0\u6CD5\u83B7\u53D6\u4F59\u989D\u4FE1\u606F\uFF0C\u63A5\u53E3\u8FD4\u56DE\u7A7A\u6570\u636E");
    }
    return {
      balance: parseFloat(data[0]["balance"]),
      arrears: parseFloat(data[0]["arrears"])
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
        account.meteringPointId
      );
      const byDay = (respData.result || []).map((dData) => ({
        date: dData.date,
        charge: parseFloat(dData.charge),
        kwh: parseFloat(dData.power)
      }));
      const monthTotalCost = respData.totalElectricity !== null ? parseFloat(respData.totalElectricity) : null;
      const monthTotalKwh = respData.totalPower !== null ? parseFloat(respData.totalPower) : null;
      const currentLadder = respData.ladderEle !== null ? parseInt(respData.ladderEle, 10) : null;
      const currentLadderStartDate = respData.ladderEleStartDate || null;
      const currentLadderRemainingKwh = respData.ladderEleSurplus !== null ? parseFloat(respData.ladderEleSurplus) : null;
      const currentTariff = respData.ladderEleTariff !== null ? parseFloat(respData.ladderEleTariff) : null;
      return {
        monthTotalCost,
        monthTotalKwh,
        ladder: {
          ladder: currentLadder,
          startDate: currentLadderStartDate,
          remainingKwh: currentLadderRemainingKwh,
          tariff: currentTariff
        },
        byDay
      };
    } catch (error) {
      let cleanMsg = error.message || String(error);
      if (cleanMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
        cleanMsg = cleanMsg.split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0].trim();
      }
      console.warn(`[CSGClient] \u63A5\u53E3 apiQueryDayElectricChargeByMPoint \u51FA\u9519\uFF0C\u5C1D\u8BD5\u964D\u7EA7\u65B9\u6848\u3002\u9519\u8BEF: ${cleanMsg}`);
      let monthTotalCost = null;
      let monthTotalKwh = null;
      const byDay = [];
      try {
        const feeDetails = await this.apiGetFeeAnalyzeDetails(year, account.areaCode, account.eleCustomerId);
        const targetMonthStr = `${year}-${String(month).padStart(2, "0")}`;
        const matchedItem = (feeDetails.electricAndChargeList || []).find(
          (item) => item.yearMonth === targetMonthStr
        );
        if (matchedItem) {
          monthTotalCost = matchedItem.actualTotalAmount ? parseFloat(matchedItem.actualTotalAmount) : null;
          monthTotalKwh = matchedItem.billingElectricity ? parseFloat(matchedItem.billingElectricity) : null;
        }
      } catch (feeError) {
        let cleanFeeMsg = feeError.message || String(feeError);
        if (cleanFeeMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
          cleanFeeMsg = cleanFeeMsg.split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0].trim();
        }
        console.warn(`[CSGClient] \u964D\u7EA7\u65B9\u6848\u83B7\u53D6\u5E74\u5EA6\u6708\u5EA6\u5206\u6790\u8D26\u5355\u5931\u8D25: ${cleanFeeMsg}`);
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
              kwh: dData.power ? parseFloat(dData.power) : 0
            });
          }
          if (monthTotalKwh === null && dayElectric.totalPower) {
            monthTotalKwh = parseFloat(dayElectric.totalPower);
          }
        }
      } catch (dayError) {
        let cleanDayMsg = dayError.message || String(dayError);
        if (cleanDayMsg.includes("\u67E5\u8BE2\u8BED\u53E5\uFF1A")) {
          cleanDayMsg = cleanDayMsg.split("\u67E5\u8BE2\u8BED\u53E5\uFF1A")[0].trim();
        }
        console.warn(`[CSGClient] \u964D\u7EA7\u65B9\u6848\u83B7\u53D6\u6BCF\u65E5\u7528\u7535\u91CF\u5931\u8D25: ${cleanDayMsg}`);
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
          tariff: null
        },
        byDay
      };
    }
  }
};

// src/profile.ts
var PROFILE_REGISTRY_ENV = "CSG_PROFILE_REGISTRY";
var SESSION_FILE_ENV = "CSG_SESSION_FILE";
var RUNTIME_DIR = path.dirname(path.resolve(process.argv[1] || process.cwd()));
function validateProfileAlias(alias) {
  const value = alias.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value)) {
    throw new Error(
      "\u7528\u6237\u914D\u7F6E\u522B\u540D\u5FC5\u987B\u4EE5\u5B57\u6BCD\u6216\u6570\u5B57\u5F00\u5934\uFF0C\u4E14\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u53F7\u3001\u4E0B\u5212\u7EBF\u6216\u77ED\u6A2A\u7EBF\u3002"
    );
  }
  return value;
}
function validateAccountNumber(accountNumber) {
  const value = String(accountNumber || "").trim();
  if (!/^\d{16}$/.test(value)) {
    throw new Error("\u7F34\u8D39\u6237\u53F7\u5FC5\u987B\u662F 16 \u4F4D\u6570\u5B57\u5B57\u7B26\u4E32\u3002");
  }
  return value;
}
function validateYear(year) {
  if (!Number.isInteger(year) || year < 2e3 || year > 2100) {
    throw new Error("\u5E74\u4EFD\u5FC5\u987B\u662F 2000 \u5230 2100 \u4E4B\u95F4\u7684 4 \u4F4D\u6574\u6570\u3002");
  }
  return year;
}
function validateMonth(month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("\u6708\u4EFD\u5FC5\u987B\u662F 1 \u5230 12 \u4E4B\u95F4\u7684\u6574\u6570\u3002");
  }
  return month;
}
function getDefaultRegistryPath() {
  if (process.env[PROFILE_REGISTRY_ENV]) {
    return path.resolve(process.env[PROFILE_REGISTRY_ENV]);
  }
  const runtimeRegistryPath = path.resolve(RUNTIME_DIR, ".csg/profiles.json");
  const projectRegistryPath = path.resolve(RUNTIME_DIR, "../.csg/profiles.json");
  const cwdRegistryPath = path.resolve(process.cwd(), ".csg/profiles.json");
  const isSourceRuntime = path.basename(RUNTIME_DIR) === "src" && fs.existsSync(path.resolve(RUNTIME_DIR, "../package.json"));
  const candidates = isSourceRuntime ? [cwdRegistryPath, projectRegistryPath, runtimeRegistryPath] : [runtimeRegistryPath, cwdRegistryPath, projectRegistryPath];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}
function getRegistryDir(registryPath = getDefaultRegistryPath()) {
  return path.dirname(registryPath);
}
function normalizeSessionPath(sessionPath, registryPath = getDefaultRegistryPath()) {
  return path.isAbsolute(sessionPath) ? sessionPath : path.resolve(getRegistryDir(registryPath), sessionPath);
}
async function readProfileRegistry(registryPath = getDefaultRegistryPath()) {
  if (!fs.existsSync(registryPath)) {
    return { profiles: [] };
  }
  let data;
  try {
    data = JSON.parse(await fs.promises.readFile(registryPath, "utf-8"));
  } catch {
    throw new Error(`\u7528\u6237\u914D\u7F6E\u6CE8\u518C\u8868\u683C\u5F0F\u635F\u574F\uFF1A${registryPath}`);
  }
  const profiles = Array.isArray(data.profiles) ? data.profiles : [];
  return {
    defaultProfile: typeof data.defaultProfile === "string" ? data.defaultProfile : void 0,
    profiles: profiles.map((profile) => ({
      alias: validateProfileAlias(String(profile.alias || "")),
      label: typeof profile.label === "string" ? profile.label : void 0,
      sessionPath: normalizeSessionPath(
        String(profile.sessionPath || ""),
        registryPath
      ),
      createdAt: typeof profile.createdAt === "string" ? profile.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : (/* @__PURE__ */ new Date()).toISOString(),
      source: "registry"
    }))
  };
}
function getEnvSessionPath() {
  const envSession = process.env[SESSION_FILE_ENV];
  if (envSession && fs.existsSync(path.resolve(envSession))) {
    return path.resolve(envSession);
  }
  return null;
}
async function listProfiles(options = {}) {
  const registry = await readProfileRegistry();
  const profiles = registry.profiles.map((profile) => ({
    ...profile,
    source: "registry"
  }));
  if (profiles.length === 0 && options.includeExplicitEnv !== false) {
    const envSessionPath = getEnvSessionPath();
    if (envSessionPath) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      profiles.push({
        alias: "session",
        label: "\u73AF\u5883\u53D8\u91CF\u4F1A\u8BDD",
        sessionPath: envSessionPath,
        createdAt: now,
        updatedAt: now,
        source: "explicit-session"
      });
    }
  }
  return profiles;
}
async function resolveProfiles(selector = {}) {
  if (selector.sessionPath) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      {
        alias: "session",
        label: "\u663E\u5F0F\u4F1A\u8BDD",
        sessionPath: path.resolve(selector.sessionPath),
        createdAt: now,
        updatedAt: now,
        source: "explicit-session"
      }
    ];
  }
  const envSessionPath = getEnvSessionPath();
  if (envSessionPath) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return [
      {
        alias: "session",
        label: "\u73AF\u5883\u53D8\u91CF\u4F1A\u8BDD",
        sessionPath: envSessionPath,
        createdAt: now,
        updatedAt: now,
        source: "explicit-session"
      }
    ];
  }
  const registry = await readProfileRegistry();
  const profiles = await listProfiles({ includeExplicitEnv: false });
  if (selector.allProfiles) {
    if (profiles.length === 0) {
      throw new Error(
        "\u5C1A\u672A\u914D\u7F6E\u4EFB\u4F55\u7528\u6237\u914D\u7F6E\u3002\u8BF7\u5148\u4F7F\u7528\u7528\u6237\u914D\u7F6E\u522B\u540D\u8FD0\u884C\u767B\u5F55\u6D41\u7A0B\u3002"
      );
    }
    return profiles;
  }
  if (selector.profile) {
    const alias = validateProfileAlias(selector.profile);
    const profile = profiles.find((item) => item.alias === alias);
    if (!profile) {
      throw new Error(`\u672A\u77E5\u7528\u6237\u914D\u7F6E '${alias}'\u3002\u8BF7\u5148\u5217\u51FA\u7528\u6237\u914D\u7F6E\u5E76\u9009\u62E9\u4E00\u4E2A\u3002`);
    }
    return [profile];
  }
  if (registry.defaultProfile) {
    const profile = profiles.find((item) => item.alias === registry.defaultProfile);
    if (!profile) {
      throw new Error(
        `\u5DF2\u914D\u7F6E\u9ED8\u8BA4\u7528\u6237\u914D\u7F6E '${registry.defaultProfile}'\uFF0C\u4F46\u5F53\u524D\u4E0D\u53EF\u7528\u3002`
      );
    }
    return [profile];
  }
  if (profiles.length === 1) {
    return [profiles[0]];
  }
  if (profiles.length > 1) {
    throw new Error("\u5DF2\u914D\u7F6E\u591A\u4E2A\u7528\u6237\u914D\u7F6E\u3002\u8BF7\u6307\u5B9A --profile \u6216 --all-profiles\u3002");
  }
  throw new Error(
    "\u6CA1\u6709\u53EF\u7528\u4F1A\u8BDD\u6216\u7528\u6237\u914D\u7F6E\u3002\u8BF7\u5148\u8FD0\u884C\u767B\u5F55\u6D41\u7A0B\uFF0C\u6216\u8BBE\u7F6E CSG_SESSION_FILE\u3002"
  );
}
async function loadSessionData(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    throw new Error(`\u4F1A\u8BDD\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${sessionPath}`);
  }
  try {
    return JSON.parse(await fs.promises.readFile(sessionPath, "utf-8"));
  } catch {
    throw new Error(`\u4F1A\u8BDD\u6587\u4EF6\u683C\u5F0F\u635F\u574F\uFF1A${sessionPath}`);
  }
}
async function initializeClientForProfile(profile) {
  const sessionData = await loadSessionData(profile.sessionPath);
  const client = CSGClient.load(sessionData);
  try {
    await client.initialize();
  } catch (error) {
    throw new Error(
      `\u521D\u59CB\u5316\u7528\u6237\u914D\u7F6E '${profile.alias}' \u5931\u8D25\u3002\u4F1A\u8BDD\u53EF\u80FD\u5DF2\u8FC7\u671F\u3002${error?.message || error}`
    );
  }
  return client;
}

// src/query-service.ts
function toPublicProfile(profile) {
  return {
    alias: profile.alias,
    label: profile.label,
    sessionPath: profile.sessionPath,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    source: profile.source
  };
}
function toAccountRecord(profile, account) {
  return {
    profile: profile.alias,
    accountNumber: account.accountNumber,
    areaCode: account.areaCode,
    eleCustomerId: account.eleCustomerId,
    meteringPointId: account.meteringPointId,
    meteringPointNumber: account.meteringPointNumber,
    address: account.address,
    userName: account.userName
  };
}
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function normalizeProfileSelector(input) {
  return {
    profile: typeof input.profile === "string" && input.profile.trim() ? validateProfileAlias(input.profile) : void 0,
    allProfiles: input.allProfiles === true || input.allProfiles === "true" || input.allProfiles === "1",
    sessionPath: typeof input.sessionPath === "string" && input.sessionPath.trim() ? input.sessionPath : void 0
  };
}
async function listProfiles2() {
  const profiles = await listProfiles({ includeExplicitEnv: true });
  return { profiles: profiles.map(toPublicProfile) };
}
async function listAccounts(selector = {}) {
  const profiles = await resolveProfiles(selector);
  const accounts = [];
  const errors = [];
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
function selectAccounts(profile, accounts, accountNumbers) {
  if (!accountNumbers || accountNumbers.length === 0) {
    return accounts.map((account) => ({ profile, account }));
  }
  const selected = [];
  for (const accountNumber of accountNumbers) {
    const normalized = validateAccountNumber(accountNumber);
    const account = accounts.find((item) => item.accountNumber === normalized);
    if (!account) {
      throw new Error(`\u6237\u53F7 ${normalized} \u672A\u7ED1\u5B9A\u5230\u7528\u6237\u914D\u7F6E '${profile.alias}'\u3002`);
    }
    selected.push({ profile, account });
  }
  return selected;
}
async function queryBalances(options) {
  const requestedAccounts = options.allAccounts ? void 0 : (options.accountNumbers || []).map(validateAccountNumber);
  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("\u9664\u975E allAccounts \u4E3A true\uFF0C\u5426\u5219\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u7F34\u8D39\u6237\u53F7\u3002");
  }
  const profiles = await resolveProfiles(options.selector || {});
  const balances = [];
  const errors = [];
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
            arrears: balance.arrears
          });
        } catch (error) {
          errors.push({
            profile: profile.alias,
            accountNumber: account.accountNumber,
            error: getErrorMessage(error)
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
async function queryUsage(options) {
  const year = validateYear(options.year);
  const month = validateMonth(options.month);
  const requestedAccounts = options.allAccounts ? void 0 : (options.accountNumbers || []).map(validateAccountNumber);
  if (!options.allAccounts && (!requestedAccounts || requestedAccounts.length === 0)) {
    throw new Error("\u9664\u975E allAccounts \u4E3A true\uFF0C\u5426\u5219\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u7F34\u8D39\u6237\u53F7\u3002");
  }
  const profiles = await resolveProfiles(options.selector || {});
  const usages = [];
  const errors = [];
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
            dailyDetails: usage.byDay
          });
        } catch (error) {
          errors.push({
            profile: profile.alias,
            accountNumber: account.accountNumber,
            error: getErrorMessage(error)
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
async function verifySessions(selector = {}) {
  const profiles = await resolveProfiles(selector);
  const results = [];
  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile);
      const valid = await client.verifyLogin();
      results.push({
        profile: profile.alias,
        valid,
        reason: valid ? void 0 : "upstream-rejected"
      });
    } catch (error) {
      results.push({
        profile: profile.alias,
        valid: false,
        reason: getErrorMessage(error)
      });
    }
  }
  return { profiles: results };
}

// src/cli.ts
function getArgValues(argName) {
  const prefix = `--${argName}=`;
  return process.argv.filter((arg) => arg.startsWith(prefix)).map((arg) => arg.slice(prefix.length)).filter(Boolean);
}
function getArgValue(argName) {
  return getArgValues(argName)[0] || null;
}
function hasFlag(argName) {
  return process.argv.includes(`--${argName}`);
}
function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}
function printJsonError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: message }));
}
function getSelectorArgs() {
  return normalizeProfileSelector({
    profile: getArgValue("profile") || void 0,
    allProfiles: hasFlag("all-profiles") || getArgValue("all-profiles") || void 0,
    sessionPath: getArgValue("session") || void 0
  });
}
function getAccountNumbers() {
  return [...getArgValues("account"), ...getArgValues("account-number")];
}
async function main() {
  const action = getArgValue("action");
  if (!action) {
    printJsonError("\u7F3A\u5C11 --action \u53C2\u6570\u3002\u4F8B\u5982\uFF1A--action=accounts");
    process.exit(1);
  }
  try {
    if (action === "profiles") {
      printJson(await listProfiles2());
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
        allAccounts: hasFlag("all-accounts")
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
        throw new Error("\u7F3A\u5C11 --year \u6216 --month \u53C2\u6570\u3002");
      }
      const result = await queryUsage({
        selector: getSelectorArgs(),
        accountNumbers: getAccountNumbers(),
        allAccounts: hasFlag("all-accounts"),
        year: Number.parseInt(yearStr, 10),
        month: Number.parseInt(monthStr, 10)
      });
      if (result.errors.length || result.usages.length !== 1) {
        printJson(result);
      } else {
        printJson(result.usages[0]);
      }
      process.exit(result.errors.length && result.usages.length === 0 ? 1 : 0);
    }
    throw new Error(`\u672A\u77E5 action\uFF1A${action}`);
  } catch (error) {
    printJsonError(error);
    process.exit(1);
  }
}
main();
