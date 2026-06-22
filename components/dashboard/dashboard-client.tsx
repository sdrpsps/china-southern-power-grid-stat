"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api, getMessage } from "@/components/dashboard/api"
import { ErrorAlert } from "@/components/dashboard/common"
import { currentDate, type QrChannel } from "@/components/dashboard/constants"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { LoginCard } from "@/components/dashboard/login-card"
import { ProfileCard } from "@/components/dashboard/profile-card"
import type {
  AccountsPayload,
  ApiState,
  BalancesPayload,
  UsagePayload,
  VerifyPayload,
} from "@/components/dashboard/types"
import { initialState } from "@/components/dashboard/types"
import { maskAccountNumber, maskName } from "@/lib/services/privacy"
import type { PublicProfile } from "@/lib/services/types"

export function DashboardClient() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [scope, setScope] = useState("profile")
  const [accountsState, setAccountsState] =
    useState<ApiState<AccountsPayload>>(initialState)
  const [balancesState, setBalancesState] =
    useState<ApiState<BalancesPayload>>(initialState)
  const [usageState, setUsageState] =
    useState<ApiState<UsagePayload>>(initialState)
  const [verifyState, setVerifyState] =
    useState<ApiState<VerifyPayload>>(initialState)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [smsSending, setSmsSending] = useState(false)
  const [smsLoginLoading, setSmsLoginLoading] = useState(false)
  const [qrCreating, setQrCreating] = useState(false)
  const [qrCompleting, setQrCompleting] = useState(false)
  const [qrChannel, setQrChannel] = useState<QrChannel>("wechat")
  const [qrLogin, setQrLogin] = useState<{
    loginId: string
    qrUrl: string
    channel: QrChannel
  } | null>(null)
  const [year, setYear] = useState(String(currentDate.getFullYear()))
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1))
  const [selectedAccount, setSelectedAccount] = useState("all")

  const hasProfiles = profiles.length > 0
  const profileItems = useMemo(
    () =>
      profiles.map((profile) => ({
        label: profile.isDefault ? `${profile.alias} · 默认` : profile.alias,
        value: profile.alias,
      })),
    [profiles]
  )
  const accountItems = useMemo(
    () => [
      { label: "全部电表账户", value: "all" },
      ...(accountsState.data?.accounts || []).map((account) => ({
        label: `${maskAccountNumber(account.accountNumber)} · ${maskName(account.userName)}`,
        value: account.accountNumber,
      })),
    ],
    [accountsState.data]
  )

  const activeSelector = useMemo(
    () => ({
      profile: scope === "profile" ? selectedProfile || undefined : undefined,
      allProfiles: scope === "all",
    }),
    [scope, selectedProfile]
  )

  useEffect(() => {
    refreshProfiles()
  }, [])

  async function refreshProfiles() {
    setProfileError(null)
    try {
      const payload = await api<{ profiles: PublicProfile[] }>("/api/profiles")
      setProfiles(payload.profiles)
      const defaultProfile = payload.profiles.find((profile) => profile.isDefault)
      setSelectedProfile((current) => current || defaultProfile?.alias || payload.profiles[0]?.alias || "")
    } catch (error) {
      setProfileError(getMessage(error))
    }
  }

  async function sendLoginSms(phoneNo: string) {
    setSmsSending(true)
    setLoginError(null)
    setLoginMessage(null)
    try {
      await api("/api/session/sms/send", {
        method: "POST",
        body: JSON.stringify({ phoneNo }),
      })
      setLoginMessage("短信验证码已发送。")
    } catch (error) {
      setLoginError(getMessage(error))
    } finally {
      setSmsSending(false)
    }
  }

  async function completeSmsLogin(formData: FormData) {
    setSmsLoginLoading(true)
    setLoginError(null)
    setLoginMessage(null)
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
      await refreshProfiles()
      setLoginMessage("登录成功，用户配置已保存。")
    } catch (error) {
      setLoginError(getMessage(error))
    } finally {
      setSmsLoginLoading(false)
    }
  }

  async function createQrLogin() {
    setQrCreating(true)
    setLoginError(null)
    setLoginMessage(null)
    try {
      const payload = await api<{ loginId: string; qrUrl: string }>("/api/session/qr", {
        method: "POST",
        body: JSON.stringify({ action: "create", channel: qrChannel }),
      })
      setQrLogin({ ...payload, channel: qrChannel })
    } catch (error) {
      setLoginError(getMessage(error))
    } finally {
      setQrCreating(false)
    }
  }

  async function completeQrLogin(formData: FormData) {
    setQrCompleting(true)
    setLoginError(null)
    setLoginMessage(null)
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
      await refreshProfiles()
      setLoginMessage("扫码登录成功，用户配置已保存。")
    } catch (error) {
      setLoginError(getMessage(error))
    } finally {
      setQrCompleting(false)
    }
  }

  async function verifySessions() {
    setVerifyState({ loading: true, data: null, error: null })
    try {
      setVerifyState({
        loading: false,
        data: await api<VerifyPayload>("/api/session/verify", {
          method: "POST",
          body: JSON.stringify(activeSelector),
        }),
        error: null,
      })
      await refreshProfiles()
    } catch (error) {
      setVerifyState({ loading: false, data: null, error: getMessage(error) })
    }
  }

  async function refreshAccounts() {
    setAccountsState({ loading: true, data: null, error: null })
    try {
      const query = new URLSearchParams()
      if (activeSelector.profile) query.set("profile", activeSelector.profile)
      if (activeSelector.allProfiles) query.set("allProfiles", "true")
      query.set("refresh", "1")
      const data = await api<AccountsPayload>(`/api/accounts?${query.toString()}`)
      setAccountsState({ loading: false, data, error: null })
      setSelectedAccount(data.accounts[0]?.accountNumber || "all")
    } catch (error) {
      setAccountsState({ loading: false, data: null, error: getMessage(error) })
    }
  }

  async function queryBalancesAction() {
    setBalancesState({ loading: true, data: null, error: null })
    try {
      setBalancesState({
        loading: false,
        data: await api<BalancesPayload>("/api/balances", {
          method: "POST",
          body: JSON.stringify({
            ...activeSelector,
            allAccounts: selectedAccount === "all",
            accountNumbers: selectedAccount === "all" ? [] : [selectedAccount],
          }),
        }),
        error: null,
      })
    } catch (error) {
      setBalancesState({ loading: false, data: null, error: getMessage(error) })
    }
  }

  async function queryUsageAction() {
    setUsageState({ loading: true, data: null, error: null })
    try {
      setUsageState({
        loading: false,
        data: await api<UsagePayload>("/api/usage", {
          method: "POST",
          body: JSON.stringify({
            ...activeSelector,
            allAccounts: selectedAccount === "all",
            accountNumbers: selectedAccount === "all" ? [] : [selectedAccount],
            year,
            month,
          }),
        }),
        error: null,
      })
    } catch (error) {
      setUsageState({ loading: false, data: null, error: getMessage(error) })
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              南方电网 · 电费查询
            </Badge>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold tracking-normal">电费与用电查询</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                管理本地用户配置，查询绑定电表账户、余额欠费和月度用电明细。
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={refreshProfiles}>
            <RefreshCwIcon data-icon="inline-start" />
            刷新配置
          </Button>
        </header>

        {profileError ? <ErrorAlert title="用户配置错误" message={profileError} /> : null}

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <ProfileCard
              hasProfiles={hasProfiles}
              profileItems={profileItems}
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              scope={scope}
              setScope={setScope}
              verifyLoading={verifyState.loading}
              onVerifySessions={verifySessions}
            />

            <LoginCard
              smsSending={smsSending}
              smsLoginLoading={smsLoginLoading}
              qrCreating={qrCreating}
              qrCompleting={qrCompleting}
              qrChannel={qrChannel}
              setQrChannel={setQrChannel}
              qrLogin={qrLogin}
              setQrLogin={setQrLogin}
              loginMessage={loginMessage}
              loginError={loginError}
              onSendLoginSms={sendLoginSms}
              onCompleteSmsLogin={completeSmsLogin}
              onCreateQrLogin={createQrLogin}
              onCompleteQrLogin={completeQrLogin}
            />
          </div>

          <DashboardTabs
            hasProfiles={hasProfiles}
            accountsState={accountsState}
            balancesState={balancesState}
            usageState={usageState}
            verifyState={verifyState}
            profiles={profiles}
            accountItems={accountItems}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            year={year}
            setYear={setYear}
            month={month}
            setMonth={setMonth}
            onRefreshAccounts={refreshAccounts}
            onQueryBalances={queryBalancesAction}
            onQueryUsage={queryUsageAction}
            onVerifySessions={verifySessions}
          />
        </section>
      </div>
    </main>
  )
}
