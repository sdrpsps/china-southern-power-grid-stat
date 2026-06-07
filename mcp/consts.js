/**
 * 南方电网 API 常量
 * 翻译自原 python 版本的 const.py
 */
export const BASE_PATH_WEB = "https://95598.csg.cn/ucs/ma/wt/";
export const BASE_PATH_APP = "https://95598.csg.cn/ucs/ma/zt/";
export const PARAM_KEY = "cOdHFNHUNkZrjNaN";
export const PARAM_IV = "oMChoRLZnTivcQyR";
export const LOGON_CHANNEL_ONLINE_HALL = "3"; // 网页端
export const LOGON_CHANNEL_HANDHELD_HALL = "4"; // APP/移动端
export const RESP_STA_SUCCESS = "00";
export const RESP_STA_EMPTY_PARAMETER = "01";
export const RESP_STA_SYSTEM_ERROR = "02";
export const RESP_STA_NO_LOGIN = "04";
export const RESP_STA_QR_NOT_SCANNED = "09";
export const SESSION_KEY_LOGIN_TYPE = "10";
export var LoginType;
(function (LoginType) {
    LoginType["LOGIN_TYPE_SMS"] = "11";
    LoginType["LOGIN_TYPE_PWD_AND_SMS"] = "1011";
    LoginType["LOGIN_TYPE_WX_QR"] = "20";
    LoginType["LOGIN_TYPE_ALI_QR"] = "21";
    LoginType["LOGIN_TYPE_CSG_QR"] = "30";
})(LoginType || (LoginType = {}));
export var QRCodeType;
(function (QRCodeType) {
    QRCodeType["QR_CSG"] = "app";
    QRCodeType["QR_WECHAT"] = "wechat";
    QRCodeType["QR_ALIPAY"] = "alipay";
})(QRCodeType || (QRCodeType = {}));
export const LOGIN_TYPE_TO_QR_CODE_TYPE = {
    [LoginType.LOGIN_TYPE_CSG_QR]: QRCodeType.QR_CSG,
    [LoginType.LOGIN_TYPE_WX_QR]: QRCodeType.QR_WECHAT,
    [LoginType.LOGIN_TYPE_ALI_QR]: QRCodeType.QR_ALIPAY,
    [LoginType.LOGIN_TYPE_SMS]: QRCodeType.QR_CSG, // 默认占位
    [LoginType.LOGIN_TYPE_PWD_AND_SMS]: QRCodeType.QR_CSG, // 默认占位
};
export const AREACODE_FALLBACK = "030000"; // 广东省代码
export const CREDENTIAL_PUBKEY = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD1RJE6GBKJlFQvTU6g0ws9R" +
    "+qXFccKl4i1Rf4KVR8Rh3XtlBtvBxEyTxnVT294RVvYz6THzHGQwREnlgdkjZyGBf7tmV2CgwaHF+ttvupuzOmRVQ" +
    "/difIJtXKM+SM0aCOqBk0fFaLiHrZlZS4qI2/rBQN8VBoVKfGinVMM+USswwIDAQAB";
export const LOGIN_TYPE_PHONE_CODE = "11";
export const LOGIN_TYPE_PHONE_PWD_CODE = "1011";
export const SEND_MSG_TYPE_VERIFICATION_CODE = "1";
export const VERIFICATION_CODE_TYPE_LOGIN = "1";
export const RESP_STA_QR_TIMEOUT = "00010001";
export const RESP_STA_LOGIN_WRONG_CREDENTIAL = "00010002";
export const QR_EXPIRY_SECONDS = 300;
// 序列化相关的 key
export const ATTR_ACCOUNT_NUMBER = "account_number";
export const ATTR_AREA_CODE = "area_code";
export const ATTR_ELE_CUSTOMER_ID = "ele_customer_id";
export const ATTR_METERING_POINT_ID = "metering_point_id";
export const ATTR_METERING_POINT_NUMBER = "metering_point_number";
export const ATTR_ADDRESS = "address";
export const ATTR_USER_NAME = "user_name";
export const ATTR_AUTH_TOKEN = "auth_token";
export const HEADER_X_AUTH_TOKEN = "x-auth-token";
export const HEADER_CUST_NUMBER = "custNumber";
export const JSON_KEY_STA = "sta";
export const JSON_KEY_MESSAGE = "message";
export const JSON_KEY_CUST_NUMBER = "custNumber";
export const JSON_KEY_DATA = "data";
export const JSON_KEY_LOGON_CHAN = "logonChan";
export const JSON_KEY_SMS_CODE = "code";
export const JSON_KEY_CRED_TYPE = "credType";
export const JSON_KEY_AREA_CODE = "areaCode";
export const JSON_KEY_PARAM = "param";
export const JSON_KEY_ACCT_ID = "acctId";
export const JSON_KEY_ELE_CUST_ID = "eleCustId";
export const JSON_KEY_METERING_POINT_ID = "meteringPointId";
export const JSON_KEY_METERING_POINT_NUMBER = "meteringPointNumber";
export const JSON_KEY_YEAR_MONTH = "yearMonth";
