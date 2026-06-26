"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon, LogOut, Key } from "lucide-react"
import { authClient } from "@/lib/auth-client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/dashboard/components/common"
import { DashboardTabs } from "@/components/dashboard/components/dashboard-tabs"
import { LoginCard } from "@/components/dashboard/components/login-card"
import { ProfileCard } from "@/components/dashboard/components/profile-card"
import { TokenDialog } from "@/components/dashboard/components/token-dialog"
import { useDashboardStore } from "@/components/dashboard/stores"

export function DashboardClient() {
  const router = useRouter()
  const { refreshProfiles, selectedProfile, scope, loadCachedAccounts, profileError } =
    useDashboardStore()

  // MCP 访问凭证状态
  const [showTokenModal, setShowTokenModal] = useState(false)

  async function handleLogout() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  // 首次加载或切换用户配置时，自动从本地数据库缓存加载电表账户
  useEffect(() => {
    if (selectedProfile || scope === "all") {
      loadCachedAccounts()
    }
  }, [selectedProfile, scope, loadCachedAccounts])

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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowTokenModal(true)} className="gap-2">
              <Key className="h-4 w-4" />
              查看 MCP 凭证
            </Button>
            <Button variant="outline" onClick={refreshProfiles} className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              刷新配置
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </header>

        {profileError ? <ErrorAlert title="用户配置错误" message={profileError} /> : null}

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <ProfileCard />
            <LoginCard />
          </div>

          <DashboardTabs />
        </section>

        {showTokenModal && (
          <TokenDialog open={showTokenModal} onClose={() => setShowTokenModal(false)} />
        )}
      </div>
    </main>
  )
}
