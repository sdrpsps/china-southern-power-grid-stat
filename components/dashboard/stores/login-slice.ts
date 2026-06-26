import type { StateCreator } from "zustand"
import { api, getMessage } from "../api"
import type { QrChannel } from "../constants"
import type { DashboardStoreState } from "./types"

export interface LoginSlice {
  // State
  loginError: string | null
  loginMessage: string | null
  smsSending: boolean
  smsLoginLoading: boolean
  qrCreating: boolean
  qrCompleting: boolean
  qrChannel: QrChannel
  qrLogin: { loginId: string; qrUrl: string; channel: QrChannel } | null

  // Setters
  setQrChannel: (channel: QrChannel) => void
  setQrLogin: (qrLogin: { loginId: string; qrUrl: string; channel: QrChannel } | null) => void
  setLoginError: (error: string | null) => void
  setLoginMessage: (message: string | null) => void

  // Async Actions
  sendLoginSms: (phoneNo: string) => Promise<void>
  completeSmsLogin: (formData: FormData) => Promise<void>
  createQrLogin: () => Promise<void>
  completeQrLogin: (formData: FormData) => Promise<void>
}

export const createLoginSlice: StateCreator<
  DashboardStoreState,
  [],
  [],
  LoginSlice
> = (set, get) => ({
  loginError: null,
  loginMessage: null,
  smsSending: false,
  smsLoginLoading: false,
  qrCreating: false,
  qrCompleting: false,
  qrChannel: "wechat",
  qrLogin: null,

  setQrChannel: (qrChannel) => set({ qrChannel }),
  setQrLogin: (qrLogin) => set({ qrLogin }),
  setLoginError: (loginError) => set({ loginError }),
  setLoginMessage: (loginMessage) => set({ loginMessage }),

  sendLoginSms: async (phoneNo) => {
    set({ smsSending: true, loginError: null, loginMessage: null })
    try {
      await api("/api/session/sms/send", {
        method: "POST",
        body: JSON.stringify({ phoneNo }),
      })
      set({ loginMessage: "短信验证码已发送。" })
    } catch (error) {
      set({ loginError: getMessage(error) })
    } finally {
      set({ smsSending: false })
    }
  },

  completeSmsLogin: async (formData) => {
    set({ smsLoginLoading: true, loginError: null, loginMessage: null })
    try {
      await api("/api/session/sms/complete", {
        method: "POST",
        body: JSON.stringify({
          alias: String(formData.get("alias") || ""),
          label: String(formData.get("label") || "") || undefined,
          phoneNo: String(formData.get("phoneNo") || ""),
          password: String(formData.get("password") || "") || undefined,
          smsCode: String(formData.get("smsCode") || ""),
          setDefault: true,
        }),
      })
      await get().refreshProfiles()
      set({ loginMessage: "登录成功，用户配置已保存。" })
    } catch (error) {
      set({ loginError: getMessage(error) })
    } finally {
      set({ smsLoginLoading: false })
    }
  },

  createQrLogin: async () => {
    const { qrChannel } = get()
    set({ qrCreating: true, loginError: null, loginMessage: null })
    try {
      const payload = await api<{ loginId: string; qrUrl: string }>("/api/session/qr", {
        method: "POST",
        body: JSON.stringify({ action: "create", channel: qrChannel }),
      })
      set({ qrLogin: { ...payload, channel: qrChannel } })
    } catch (error) {
      set({ loginError: getMessage(error) })
    } finally {
      set({ qrCreating: false })
    }
  },

  completeQrLogin: async (formData) => {
    const { qrLogin } = get()
    set({ qrCompleting: true, loginError: null, loginMessage: null })
    try {
      if (!qrLogin?.loginId) {
        throw new Error("请先生成登录二维码。")
      }
      const payload = await api<{ success?: boolean }>("/api/session/qr", {
        method: "POST",
        body: JSON.stringify({
          action: "complete",
          loginId: qrLogin.loginId,
          alias: String(formData.get("alias") || ""),
          label: String(formData.get("label") || "") || undefined,
          setDefault: true,
        }),
      })
      if (payload.success === false) {
        throw new Error("扫码登录尚未确认。")
      }
      await get().refreshProfiles()
      set({ loginMessage: "扫码登录成功，用户配置已保存。" })
    } catch (error) {
      set({ loginError: getMessage(error) })
    } finally {
      set({ qrCompleting: false })
    }
  },
})
