/* eslint-disable @typescript-eslint/no-explicit-any */
import * as crypto from "node:crypto"

import {
  AREACODE_FALLBACK,
  BASE_PATH_APP,
  BASE_PATH_WEB,
  CREDENTIAL_PUBKEY,
  HEADER_CUST_NUMBER,
  HEADER_X_AUTH_TOKEN,
  JSON_KEY_ACCT_ID,
  JSON_KEY_AREA_CODE,
  JSON_KEY_CRED_TYPE,
  JSON_KEY_CUST_NUMBER,
  JSON_KEY_DATA,
  JSON_KEY_ELE_CUST_ID,
  JSON_KEY_LOGON_CHAN,
  JSON_KEY_MESSAGE,
  JSON_KEY_METERING_POINT_ID,
  JSON_KEY_METERING_POINT_NUMBER,
  JSON_KEY_PARAM,
  JSON_KEY_SMS_CODE,
  JSON_KEY_STA,
  JSON_KEY_YEAR_MONTH,
  LOGIN_TYPE_PHONE_CODE,
  LOGIN_TYPE_PHONE_PWD_CODE,
  LOGON_CHANNEL_HANDHELD_HALL,
  PARAM_IV,
  PARAM_KEY,
  QRCodeType,
  RESP_STA_QR_NOT_SCANNED,
  RESP_STA_SUCCESS,
  SEND_MSG_TYPE_VERIFICATION_CODE,
  VERIFICATION_CODE_TYPE_LOGIN,
} from "@/lib/csg/constants"

export { QRCodeType }

export function encryptCredential(password: string): string {
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${CREDENTIAL_PUBKEY}\n-----END PUBLIC KEY-----`
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, "utf8")
  )
  return encrypted.toString("base64")
}

export function encryptParams(params: Record<string, unknown>): string {
  const jsonStr = JSON.stringify(params)
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(PARAM_KEY, "utf8"),
    Buffer.from(PARAM_IV, "utf8")
  )
  cipher.setAutoPadding(false)

  let buf = Buffer.from(jsonStr, "utf8")
  const padLen = 16 - (buf.length % 16)
  if (padLen > 0) {
    buf = Buffer.concat([buf, Buffer.alloc(padLen, 0)])
  }

  return Buffer.concat([cipher.update(buf), cipher.final()]).toString("base64")
}

function generateQrLoginId(): string {
  return crypto.createHash("md5").update(`${Date.now()}${Math.random()}`).digest("hex")
}

function toNumber(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"))
  return Number.isFinite(parsed) ? parsed : 0
}

export class CSGElectricityAccount {
  accountNumber: string
  areaCode: string
  eleCustomerId: string
  meteringPointId: string
  meteringPointNumber: string
  address: string
  userName: string

  constructor(options: {
    accountNumber: string
    areaCode: string
    eleCustomerId: string
    meteringPointId: string
    meteringPointNumber: string
    address: string
    userName: string
  }) {
    this.accountNumber = options.accountNumber
    this.areaCode = options.areaCode
    this.eleCustomerId = options.eleCustomerId
    this.meteringPointId = options.meteringPointId
    this.meteringPointNumber = options.meteringPointNumber
    this.address = options.address
    this.userName = options.userName
  }
}

export class CSGClient {
  authToken: string | null = null
  customerNumber: string | null = null

  constructor(authToken: string | null = null) {
    this.authToken = authToken
  }

  private async makeRequest(
    path: string,
    payload: Record<string, unknown> | null,
    options: {
      withAuth?: boolean
      method?: string
      customHeaders?: Record<string, string>
      basePath?: string
    } = {}
  ): Promise<{ headers: Headers; data: Record<string, any> }> {
    const {
      withAuth = true,
      method = "POST",
      customHeaders = {},
      basePath = BASE_PATH_APP,
    } = options

    const headers: Record<string, string> = {
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
    }

    if (withAuth) {
      headers[HEADER_X_AUTH_TOKEN] = this.authToken || ""
      headers[HEADER_CUST_NUMBER] = this.customerNumber || ""
    }

    const response = await fetch(basePath + path, {
      method,
      headers,
      body: method === "POST" && payload !== null ? JSON.stringify(payload) : undefined,
    })
    if (!response.ok) {
      throw new Error(`HTTP 请求失败：${response.status}`)
    }

    const text = await response.text()
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start === -1 || end === -1) {
      throw new Error(`返回数据格式不正确，未包含 JSON: ${text}`)
    }
    return { headers: response.headers, data: JSON.parse(text.substring(start, end + 1)) }
  }

  private handleUnsuccessfulResponse(path: string, responseData: Record<string, any>) {
    throw new Error(
      `接口错误 [${path}] (sta=${responseData[JSON_KEY_STA]}): ${
        responseData[JSON_KEY_MESSAGE] || "未知错误"
      }`
    )
  }

  async apiSendLoginSms(phoneNo: string): Promise<boolean> {
    if (process.env.CSG_MOCK === "1") return Boolean(phoneNo)

    const path = "center/sendMsg"
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      phoneNumber: phoneNo,
      vcType: VERIFICATION_CODE_TYPE_LOGIN,
      msgType: SEND_MSG_TYPE_VERIFICATION_CODE,
    }
    const { data } = await this.makeRequest(path, payload, { withAuth: false })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return true
    this.handleUnsuccessfulResponse(path, data)
    return false
  }

  async apiCreateLoginQrCode(channel: QRCodeType, loginId?: string) {
    if (process.env.CSG_MOCK === "1") {
      const finalLoginId = loginId || generateQrLoginId()
      const label =
        channel === QRCodeType.QR_WECHAT
          ? "WECHAT"
          : channel === QRCodeType.QR_ALIPAY
            ? "ALIPAY"
            : "CSG APP"
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="white"/><rect x="20" y="20" width="50" height="50" fill="black"/><rect x="150" y="20" width="50" height="50" fill="black"/><rect x="20" y="150" width="50" height="50" fill="black"/><rect x="92" y="92" width="36" height="36" fill="black"/><text x="110" y="206" font-size="14" text-anchor="middle" fill="black">${label}</text></svg>`
      return { loginId: finalLoginId, qrUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }
    }

    const path = "center/createLoginQrcode"
    const finalLoginId = loginId || generateQrLoginId()
    const payload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      channel,
      lgoinId: finalLoginId,
    }
    const { data } = await this.makeRequest(path, payload, {
      withAuth: false,
      basePath: BASE_PATH_WEB,
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return { loginId: finalLoginId, qrUrl: data[JSON_KEY_DATA] as string }
    }
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("创建登录二维码失败")
  }

  async apiGetQrLoginStatus(loginId: string): Promise<{ success: boolean; authToken: string }> {
    if (process.env.CSG_MOCK === "1") {
      return { success: Boolean(loginId), authToken: loginId ? `mock-qr-token-${loginId}` : "" }
    }

    const path = "center/getLoginInfo"
    const { headers, data } = await this.makeRequest(
      path,
      { [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK, loginId },
      { withAuth: false, basePath: BASE_PATH_WEB }
    )
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return { success: true, authToken: headers.get(HEADER_X_AUTH_TOKEN) || "" }
    }
    if (data[JSON_KEY_STA] === RESP_STA_QR_NOT_SCANNED) {
      return { success: false, authToken: "" }
    }
    this.handleUnsuccessfulResponse(path, data)
    return { success: false, authToken: "" }
  }

  async apiLoginWithSmsCode(phoneNo: string, smsCode: string): Promise<string> {
    if (process.env.CSG_MOCK === "1") {
      if (!phoneNo || !smsCode) throw new Error("手机号和短信验证码不能为空。")
      return `mock-sms-token-${phoneNo}`
    }

    const path = "center/login"
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_CODE,
      [JSON_KEY_SMS_CODE]: smsCode,
    }
    const { headers, data } = await this.makeRequest(
      path,
      { [JSON_KEY_PARAM]: encryptParams(innerPayload) },
      { withAuth: false, customHeaders: { "need-crypto": "true" } }
    )
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || ""
    }
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("短信验证码登录失败")
  }

  async apiLoginWithPasswordAndSmsCode(
    phoneNo: string,
    password: string,
    smsCode: string
  ): Promise<string> {
    if (process.env.CSG_MOCK === "1") {
      if (!phoneNo || !password || !smsCode) throw new Error("手机号、密码和短信验证码不能为空。")
      return `mock-password-sms-token-${phoneNo}`
    }

    const path = "center/loginByPwdAndMsg"
    const innerPayload = {
      [JSON_KEY_AREA_CODE]: AREACODE_FALLBACK,
      [JSON_KEY_ACCT_ID]: phoneNo,
      [JSON_KEY_LOGON_CHAN]: LOGON_CHANNEL_HANDHELD_HALL,
      [JSON_KEY_CRED_TYPE]: LOGIN_TYPE_PHONE_PWD_CODE,
      credentials: encryptCredential(password),
      [JSON_KEY_SMS_CODE]: smsCode,
      checkPwd: true,
    }
    const { headers, data } = await this.makeRequest(
      path,
      { [JSON_KEY_PARAM]: encryptParams(innerPayload) },
      { withAuth: false, customHeaders: { "need-crypto": "true" } }
    )
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) {
      return headers.get(HEADER_X_AUTH_TOKEN) || ""
    }
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("账号密码+短信验证码登录失败")
  }

  async apiQueryAuthenticationResult(): Promise<unknown> {
    const path = "user/queryAuthenticationResult"
    const { data } = await this.makeRequest(path, null)
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("验证会话失败")
  }

  async apiGetUserInfo(): Promise<Record<string, any>> {
    const path = "user/getUserInfo"
    const { data } = await this.makeRequest(path, null)
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("获取用户信息失败")
  }

  async apiGetAllLinkedElectricityAccounts(): Promise<Record<string, any>[]> {
    const path = "eleCustNumber/queryBindEleUsers"
    const { data } = await this.makeRequest(path, {})
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA] || []
    this.handleUnsuccessfulResponse(path, data)
    return []
  }

  async apiGetMeteringPoint(areaCode: string, eleCustomerId: string): Promise<Record<string, any>[]> {
    const path = "charge/queryMeteringPoint"
    const { data } = await this.makeRequest(path, {
      [JSON_KEY_AREA_CODE]: areaCode,
      eleCustNumberList: [{ [JSON_KEY_ELE_CUST_ID]: eleCustomerId, [JSON_KEY_AREA_CODE]: areaCode }],
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("查询计量点失败")
  }

  async apiQueryAccountSurplus(areaCode: string, eleCustomerId: string) {
    const path = "charge/queryUserAccountNumberSurplus"
    const { data } = await this.makeRequest(path, {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
    throw new Error("查询余额失败")
  }

  async apiQueryDayElectricByMPoint(
    year: number,
    month: number,
    areaCode: string,
    eleCustomerId: string,
    meteringPointId: string
  ) {
    const path = "charge/queryDayElectricByMPoint"
    const { data } = await this.makeRequest(path, {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
  }

  async apiQueryDayElectricChargeByMPoint(
    year: number,
    month: number,
    areaCode: string,
    eleCustomerId: string,
    meteringPointId: string
  ) {
    const path = "charge/queryDayElectricChargeByMPoint"
    const { data } = await this.makeRequest(path, {
      [JSON_KEY_AREA_CODE]: areaCode,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_YEAR_MONTH]: `${year}${String(month).padStart(2, "0")}`,
      [JSON_KEY_METERING_POINT_ID]: meteringPointId,
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
  }

  async apiGetFeeAnalyzeDetails(year: number, areaCode: string, eleCustomerId: string) {
    const path = "charge/getAnalyzeFeeDetails"
    const { data } = await this.makeRequest(path, {
      [JSON_KEY_AREA_CODE]: areaCode,
      electricityBillYear: year,
      [JSON_KEY_ELE_CUST_ID]: eleCustomerId,
      [JSON_KEY_METERING_POINT_ID]: null,
    })
    if (data[JSON_KEY_STA] === RESP_STA_SUCCESS) return data[JSON_KEY_DATA]
    this.handleUnsuccessfulResponse(path, data)
  }

  async initialize(): Promise<void> {
    if (process.env.CSG_MOCK === "1") {
      this.customerNumber = "mock-customer"
      return
    }
    const userData = await this.apiGetUserInfo()
    this.customerNumber = userData[JSON_KEY_CUST_NUMBER]
  }

  async verifyLogin(): Promise<boolean> {
    if (process.env.CSG_MOCK === "1") return Boolean(this.authToken)
    try {
      await this.apiQueryAuthenticationResult()
      return true
    } catch {
      return false
    }
  }

  dump() {
    return { auth_token: this.authToken }
  }

  static load(data: Record<string, any>): CSGClient {
    if (!data.auth_token) {
      throw new Error("会话数据中未发现 auth_token")
    }
    return new CSGClient(data.auth_token)
  }

  async getAllElectricityAccounts(): Promise<CSGElectricityAccount[]> {
    if (process.env.CSG_MOCK === "1") {
      return [
        new CSGElectricityAccount({
          accountNumber: "030000000000001",
          areaCode: AREACODE_FALLBACK,
          eleCustomerId: "mock-customer-1",
          meteringPointId: "mock-point-1",
          meteringPointNumber: "MP-001",
          address: "广东省广州市示例路 1 号",
          userName: "测试用户",
        }),
      ]
    }

    const accountsData = await this.apiGetAllLinkedElectricityAccounts()
    const result: CSGElectricityAccount[] = []
    for (const item of accountsData) {
      const meteringPointData = await this.apiGetMeteringPoint(item[JSON_KEY_AREA_CODE], item.bindingId)
      if (!meteringPointData || meteringPointData.length === 0) continue
      result.push(
        new CSGElectricityAccount({
          accountNumber: item.eleCustNumber,
          areaCode: item[JSON_KEY_AREA_CODE],
          eleCustomerId: item.bindingId,
          meteringPointId: meteringPointData[0][JSON_KEY_METERING_POINT_ID],
          meteringPointNumber: meteringPointData[0][JSON_KEY_METERING_POINT_NUMBER] || "",
          address: item.eleAddress,
          userName: item.userName,
        })
      )
    }
    return result
  }

  async getBalanceAndArrears(account: CSGElectricityAccount): Promise<{ balance: number; arrears: number }> {
    if (process.env.CSG_MOCK === "1") return { balance: 128.45, arrears: 0 }
    const data = await this.apiQueryAccountSurplus(account.areaCode, account.eleCustomerId)
    if (!data || data.length === 0) throw new Error("无法获取余额信息，接口返回空数据")
    return { balance: toNumber(data[0].balance), arrears: toNumber(data[0].arrears) }
  }

  async getMonthDailyCostDetail(
    account: CSGElectricityAccount,
    year: number,
    month: number
  ): Promise<{
    monthTotalCost: number | null
    monthTotalKwh: number | null
    ladder: {
      ladder: number | null
      startDate: string | null
      remainingKwh: number | null
      tariff: number | null
    }
    byDay: Array<{ date: string; charge: number; kwh: number }>
  }> {
    if (process.env.CSG_MOCK === "1") {
      const byDay = Array.from({ length: 12 }, (_, index) => {
        const day = index + 1
        const kwh = Number((3 + (index % 4) * 0.8).toFixed(2))
        return {
          date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          charge: Number((kwh * 0.68).toFixed(2)),
          kwh,
        }
      })
      return {
        monthTotalCost: Number(byDay.reduce((sum, item) => sum + item.charge, 0).toFixed(2)),
        monthTotalKwh: Number(byDay.reduce((sum, item) => sum + item.kwh, 0).toFixed(2)),
        ladder: { ladder: 1, startDate: `${year}-01-01`, remainingKwh: 180, tariff: 0.68 },
        byDay,
      }
    }

    try {
      const respData = await this.apiQueryDayElectricChargeByMPoint(
        year,
        month,
        account.areaCode,
        account.eleCustomerId,
        account.meteringPointId
      )
      const byDay = (respData.result || []).map((dData: any) => ({
        date: dData.date,
        charge: toNumber(dData.charge),
        kwh: toNumber(dData.power),
      }))
      return {
        monthTotalCost: respData.totalElectricity !== null ? toNumber(respData.totalElectricity) : null,
        monthTotalKwh: respData.totalPower !== null ? toNumber(respData.totalPower) : null,
        ladder: {
          ladder: respData.ladderEle !== null ? Number.parseInt(respData.ladderEle, 10) : null,
          startDate: respData.ladderEleStartDate || null,
          remainingKwh: respData.ladderEleSurplus !== null ? toNumber(respData.ladderEleSurplus) : null,
          tariff: respData.ladderEleTariff !== null ? toNumber(respData.ladderEleTariff) : null,
        },
        byDay,
      }
    } catch (error) {
      let monthTotalCost: number | null = null
      let monthTotalKwh: number | null = null
      const byDay: Array<{ date: string; charge: number; kwh: number }> = []

      try {
        const feeDetails = await this.apiGetFeeAnalyzeDetails(year, account.areaCode, account.eleCustomerId)
        const targetMonthStr = `${year}-${String(month).padStart(2, "0")}`
        const matchedItem = (feeDetails.electricAndChargeList || []).find(
          (item: any) => item.yearMonth === targetMonthStr
        )
        if (matchedItem) {
          monthTotalCost = matchedItem.actualTotalAmount ? toNumber(matchedItem.actualTotalAmount) : null
          monthTotalKwh = matchedItem.billingElectricity ? toNumber(matchedItem.billingElectricity) : null
        }
      } catch {
        // Keep the original query error unless the daily fallback succeeds.
      }

      try {
        const dayElectric = await this.apiQueryDayElectricByMPoint(
          year,
          month,
          account.areaCode,
          account.eleCustomerId,
          account.meteringPointId
        )
        if (dayElectric?.result) {
          for (const dData of dayElectric.result) {
            byDay.push({
              date: dData.date,
              charge: 0,
              kwh: dData.power ? toNumber(dData.power) : 0,
            })
          }
          if (monthTotalKwh === null && dayElectric.totalPower) {
            monthTotalKwh = toNumber(dayElectric.totalPower)
          }
        }
      } catch {
        // Keep the original query error unless the annual fallback succeeded.
      }

      if (monthTotalCost === null && monthTotalKwh === null && byDay.length === 0) {
        throw error
      }

      return {
        monthTotalCost,
        monthTotalKwh,
        ladder: { ladder: null, startDate: null, remainingKwh: null, tariff: null },
        byDay,
      }
    }
  }
}
