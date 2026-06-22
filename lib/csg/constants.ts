export const BASE_PATH_WEB = "https://95598.csg.cn/ucs/ma/wt/"
export const BASE_PATH_APP = "https://95598.csg.cn/ucs/ma/zt/"

export const PARAM_KEY = "cOdHFNHUNkZrjNaN"
export const PARAM_IV = "oMChoRLZnTivcQyR"

export const LOGON_CHANNEL_HANDHELD_HALL = "4"
export const RESP_STA_SUCCESS = "00"
export const RESP_STA_QR_NOT_SCANNED = "09"
export const AREACODE_FALLBACK = "030000"

export const CREDENTIAL_PUBKEY =
  "MIGfMA0GCSqGSIbDQEBAQUAA4GNADCBiQKBgQD1RJE6GBKJlFQvTU6g0ws9R" +
  "+qXFccKl4i1Rf4KVR8Rh3XtlBtvBxEyTxnVT294RVvYz6THzHGQwREnlgdkjZyGBf7tmV2CgwaHF+ttvupuzOmRVQ" +
  "/difIJtXKM+SM0aCOqBk0fFaLiHrZlZS4qI2/rBQN8VBoVKfGinVMM+USswwIDAQAB"

export const LOGIN_TYPE_PHONE_CODE = "11"
export const LOGIN_TYPE_PHONE_PWD_CODE = "1011"
export const SEND_MSG_TYPE_VERIFICATION_CODE = "1"
export const VERIFICATION_CODE_TYPE_LOGIN = "1"

export const HEADER_X_AUTH_TOKEN = "x-auth-token"
export const HEADER_CUST_NUMBER = "custNumber"
export const JSON_KEY_STA = "sta"
export const JSON_KEY_MESSAGE = "message"
export const JSON_KEY_CUST_NUMBER = "custNumber"
export const JSON_KEY_DATA = "data"
export const JSON_KEY_LOGON_CHAN = "logonChan"
export const JSON_KEY_SMS_CODE = "code"
export const JSON_KEY_CRED_TYPE = "credType"
export const JSON_KEY_AREA_CODE = "areaCode"
export const JSON_KEY_PARAM = "param"
export const JSON_KEY_ACCT_ID = "acctId"
export const JSON_KEY_ELE_CUST_ID = "eleCustId"
export const JSON_KEY_METERING_POINT_ID = "meteringPointId"
export const JSON_KEY_METERING_POINT_NUMBER = "meteringPointNumber"
export const JSON_KEY_YEAR_MONTH = "yearMonth"

export enum QRCodeType {
  QR_CSG = "app",
  QR_WECHAT = "wechat",
  QR_ALIPAY = "alipay",
}
