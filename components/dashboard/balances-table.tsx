import { WalletCardsIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState, ErrorAlert, ErrorsList, LoadingRows, Metric } from "@/components/dashboard/common"
import type { ApiState, BalancesPayload } from "@/components/dashboard/types"
import { maskAccountNumber, maskAddress, maskName } from "@/lib/services/privacy"

export function BalancesTable({ state }: { state: ApiState<BalancesPayload> }) {
  if (state.loading) return <LoadingRows />
  if (state.error) return <ErrorAlert title="余额查询失败" message={state.error} />
  if (!state.data) return <EmptyState icon={<WalletCardsIcon />} title="尚未查询余额" description="先刷新电表账户，然后选择电费户号查询余额。" />
  return (
    <div className="flex flex-col gap-4">
      <ErrorsList errors={state.data.errors} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.data.balances.map((balance) => (
          <Card key={`${balance.profile}-${balance.accountNumber}`}>
            <CardHeader>
              <CardTitle className="text-base">{maskAccountNumber(balance.accountNumber)}</CardTitle>
              <CardDescription>
                {balance.profile} · {maskName(balance.userName)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Metric label="余额" value={`¥${balance.balance.toFixed(2)}`} />
              <Metric label="欠费" value={`¥${balance.arrears.toFixed(2)}`} />
            </CardContent>
            <CardFooter>
              <p className="truncate text-xs text-muted-foreground">{maskAddress(balance.address)}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
