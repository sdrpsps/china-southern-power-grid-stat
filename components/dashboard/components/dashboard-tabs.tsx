"use client"

import { CheckCircle2Icon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountsTable } from "./accounts-table"
import { BalancesTable } from "./balances-table"
import { DataCard } from "./data-card"
import { QueryControls, UsageControls } from "./query-controls"
import { UsagePanel } from "./usage-panel"
import { VerifyPanel } from "./verify-panel"
import { useDashboardStore } from "@/components/dashboard/stores"

export function DashboardTabs() {
  const {
    profiles,
    accountsState,
    balancesState,
    usageState,
    verifyState,
    selectedAccount,
    setSelectedAccount,
    year,
    setYear,
    month,
    setMonth,
    hasProfiles,
    accountItems,
    refreshAccounts,
    queryBalancesAction,
    queryUsageAction,
    verifySessions,
  } = useDashboardStore()

  const hasProfs = hasProfiles()
  const accItems = accountItems()

  return (
    <Tabs defaultValue="accounts" className="flex min-w-0 flex-col gap-4">
      <TabsList>
        <TabsTrigger value="accounts">电表</TabsTrigger>
        <TabsTrigger value="balance">余额</TabsTrigger>
        <TabsTrigger value="usage">用量</TabsTrigger>
        <TabsTrigger value="status">状态</TabsTrigger>
      </TabsList>

      <TabsContent value="accounts">
        <DataCard
          title="电表账户"
          description="从南方电网读取当前账号绑定的电费户号和电表信息。"
        >
          <AccountsTable
            state={accountsState}
            action={
              <Button
                className="w-full sm:w-auto"
                onClick={refreshAccounts}
                disabled={!hasProfs || accountsState.loading}
              >
                {accountsState.loading ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <RefreshCwIcon data-icon="inline-start" />
                )}
                刷新电表账户
              </Button>
            }
          />
        </DataCard>
      </TabsContent>

      <TabsContent value="balance">
        <DataCard
          title="余额与欠费"
          description="选择电费户号后查询余额与欠费；全部电表账户模式会保留逐户号错误。"
          action={
            <QueryControls
              accountItems={accItems}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              onSubmit={queryBalancesAction}
              loading={balancesState.loading}
              disabled={!accountsState.data?.accounts.length}
              label="查询余额"
            />
          }
        >
          <BalancesTable state={balancesState} />
        </DataCard>
      </TabsContent>

      <TabsContent value="usage">
        <DataCard
          title="月度用量"
          description="查询月度总电费、总电量、阶梯信息和每日明细。"
          action={
            <UsageControls
              accountItems={accItems}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              year={year}
              setYear={setYear}
              month={month}
              setMonth={setMonth}
              onSubmit={queryUsageAction}
              loading={usageState.loading}
              disabled={!accountsState.data?.accounts.length}
            />
          }
        >
          <UsagePanel state={usageState} />
        </DataCard>
      </TabsContent>

      <TabsContent value="status">
        <DataCard
          title="会话验证"
          description="检查当前用户配置的登录状态是否仍然有效。"
          action={
            <Button onClick={verifySessions} disabled={!hasProfs || verifyState.loading}>
              {verifyState.loading ? <Spinner data-icon="inline-start" /> : <CheckCircle2Icon data-icon="inline-start" />}
              立即验证
            </Button>
          }
        >
          <VerifyPanel state={verifyState} profiles={profiles} />
        </DataCard>
      </TabsContent>
    </Tabs>
  )
}
