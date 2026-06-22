import { CSGClient, QRCodeType } from "@/lib/csg/client"
import {
  getDefaultProfile,
  getProfileByAlias,
  getSessionForProfile,
  listProfilesWithSessions,
  listPublicProfiles,
  logOperation,
  saveSession,
  setDefaultProfile,
  updateSessionValidity,
  upsertProfile,
} from "@/lib/services/repositories"
import type { ProfileSelector, SessionProfile } from "@/lib/services/types"
import { getErrorMessage, validateProfileAlias } from "@/lib/services/validation"

export async function getProfiles() {
  return { profiles: await listPublicProfiles() }
}

export async function chooseDefaultProfile(alias: string) {
  await setDefaultProfile(validateProfileAlias(alias))
  await logOperation({ operation: "profile.default", profileAlias: alias, status: "success" })
  return getProfiles()
}

export async function resolveSessionProfiles(selector: ProfileSelector = {}): Promise<SessionProfile[]> {
  const all = await listProfilesWithSessions()
  const withSessions = all.filter((item) => item.session?.authToken)

  if (selector.allProfiles) {
    if (withSessions.length === 0) {
      throw new Error("尚未配置任何带会话的用户配置。")
    }
    return withSessions.map(toSessionProfile)
  }

  if (selector.profile) {
    const alias = validateProfileAlias(selector.profile)
    const found = all.find((item) => item.profile.alias === alias)
    if (!found) {
      throw new Error(`未知用户配置 '${alias}'。请先通过南方电网登录添加该用户配置。`)
    }
    if (!found.session?.authToken) {
      throw new Error(`用户配置 '${alias}' 尚未登录生成有效会话。`)
    }
    return [toSessionProfile(found)]
  }

  const defaultProfile = await getDefaultProfile()
  if (defaultProfile) {
    const session = await getSessionForProfile(defaultProfile.id)
    if (!session?.authToken) {
      throw new Error(`默认用户配置 '${defaultProfile.alias}' 尚未登录生成有效会话。`)
    }
    return [
      {
        id: defaultProfile.id,
        alias: defaultProfile.alias,
        label: defaultProfile.label,
        isDefault: defaultProfile.isDefault,
        authToken: session.authToken,
        createdAt: defaultProfile.createdAt,
        updatedAt: defaultProfile.updatedAt,
      },
    ]
  }

  if (withSessions.length === 1) {
    return [toSessionProfile(withSessions[0])]
  }

  if (withSessions.length > 1) {
    throw new Error("已配置多个用户配置。请指定 profile 或 allProfiles。")
  }

  throw new Error("没有可用会话或用户配置。请先在 Web 页面登录。")
}

function toSessionProfile(item: Awaited<ReturnType<typeof listProfilesWithSessions>>[number]): SessionProfile {
  return {
    id: item.profile.id,
    alias: item.profile.alias,
    label: item.profile.label,
    isDefault: item.profile.isDefault,
    authToken: item.session!.authToken,
    createdAt: item.profile.createdAt,
    updatedAt: item.profile.updatedAt,
  }
}

export async function initializeClientForProfile(profile: SessionProfile) {
  const client = new CSGClient(profile.authToken)
  try {
    await client.initialize()
  } catch (error) {
    throw new Error(`初始化用户配置 '${profile.alias}' 失败。会话可能已过期。${getErrorMessage(error)}`)
  }
  return client
}

export async function verifyStoredProfiles(selector: ProfileSelector = {}) {
  const profiles = await resolveSessionProfiles(selector)
  const results = []
  for (const profile of profiles) {
    try {
      const client = await initializeClientForProfile(profile)
      const valid = await client.verifyLogin()
      const lastVerifiedAt = await updateSessionValidity(profile.id, valid)
      await logOperation({
        operation: "session.verify",
        profileAlias: profile.alias,
        status: valid ? "success" : "failure",
        summary: valid ? "会话有效" : "上游拒绝会话",
      })
      results.push({
        profile: profile.alias,
        valid,
        reason: valid ? undefined : "upstream-rejected",
        lastVerifiedAt,
      })
    } catch (error) {
      await updateSessionValidity(profile.id, false)
      await logOperation({
        operation: "session.verify",
        profileAlias: profile.alias,
        status: "failure",
        error: getErrorMessage(error),
      })
      results.push({ profile: profile.alias, valid: false, reason: getErrorMessage(error) })
    }
  }
  return { profiles: results }
}

export async function persistLoginSession(input: {
  alias: string
  label?: string | null
  authToken: string
  setDefault?: boolean
}) {
  const alias = validateProfileAlias(input.alias)
  const authToken = input.authToken.trim()
  if (!authToken) throw new Error("登录未返回有效会话。")
  const client = CSGClient.load({ auth_token: authToken })
  await client.initialize()
  const valid = await client.verifyLogin()
  if (!valid) {
    throw new Error("登录态验证失败，请重新登录。")
  }

  const profile = await upsertProfile({
    alias,
    label: input.label,
    setDefault: input.setDefault,
  })
  const verifiedAt = new Date().toISOString()
  await saveSession({
    profileId: profile.id,
    authToken,
    valid: true,
    lastVerifiedAt: verifiedAt,
  })
  await logOperation({
    operation: "session.login",
    profileAlias: alias,
    status: "success",
    summary: "网页登录成功",
  })
  return { profile: { ...profile, hasSession: true, sessionValid: true, lastVerifiedAt: verifiedAt } }
}

export async function sendLoginSms(phoneNo: string) {
  const client = new CSGClient()
  await client.apiSendLoginSms(phoneNo)
  await logOperation({ operation: "login.sms.send", status: "success", summary: "短信验证码已发送" })
  return { sent: true }
}

export async function completeSmsLogin(input: {
  alias: string
  label?: string | null
  phoneNo: string
  smsCode: string
  password?: string
  setDefault?: boolean
}) {
  const alias = validateProfileAlias(input.alias)
  const client = new CSGClient()
  const authToken = input.password
    ? await client.apiLoginWithPasswordAndSmsCode(input.phoneNo, input.password, input.smsCode)
    : await client.apiLoginWithSmsCode(input.phoneNo, input.smsCode)
  return persistLoginSession({
    alias,
    label: input.label,
    authToken,
    setDefault: input.setDefault,
  })
}

export async function createQrLogin(channel: string) {
  if (!Object.values(QRCodeType).includes(channel as QRCodeType)) {
    throw new Error("扫码平台必须是 wechat、alipay 或 app。")
  }
  const client = new CSGClient()
  return client.apiCreateLoginQrCode(channel as QRCodeType)
}

export async function completeQrLogin(input: {
  alias: string
  label?: string | null
  loginId: string
  setDefault?: boolean
}) {
  const client = new CSGClient()
  const status = await client.apiGetQrLoginStatus(input.loginId)
  if (!status.success || !status.authToken) {
    return { success: false }
  }
  const result = await persistLoginSession({
    alias: input.alias,
    label: input.label,
    authToken: status.authToken,
    setDefault: input.setDefault,
  })
  return { success: true, ...result }
}

export async function ensureProfileExists(alias: string) {
  const profile = await getProfileByAlias(validateProfileAlias(alias))
  if (!profile) throw new Error(`未知用户配置 '${alias}'。`)
  return profile
}
