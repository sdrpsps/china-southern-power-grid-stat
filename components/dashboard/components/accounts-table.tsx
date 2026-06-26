import type { ReactNode } from "react"
import { PlugZapIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState, ErrorAlert, ErrorsList, LoadingRows } from "@/components/dashboard/components/common"
import type { AccountsPayload, ApiState } from "@/components/dashboard/types"
import { maskAccountNumber, maskAddress, maskName } from "@/lib/services/privacy"

export function AccountsTable({
  state,
  action,
}: {
  state: ApiState<AccountsPayload>
  action?: ReactNode
}) {
  if (state.loading) return <LoadingRows />
  if (state.error) {
    return (
      <div className="flex flex-col gap-4">
        {action ? <div className="flex justify-end">{action}</div> : null}
        <ErrorAlert title="电表账户刷新失败" message={state.error} />
      </div>
    )
  }
  if (!state.data) {
    return (
      <EmptyState
        icon={<PlugZapIcon />}
        title="尚未加载电表账户"
        description="先完成南方电网登录，然后刷新电表账户。"
        action={action}
      />
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {action && state.data.accounts.length ? <div className="flex justify-end">{action}</div> : null}
      <ErrorsList errors={state.data.errors} />
      {state.data.accounts.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>配置</TableHead>
              <TableHead>户号</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>计量点</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.data.accounts.map((account) => (
              <TableRow key={`${account.profile}-${account.accountNumber}`}>
                <TableCell>
                  <Badge variant="secondary">{account.profile}</Badge>
                </TableCell>
                <TableCell className="font-mono">{maskAccountNumber(account.accountNumber)}</TableCell>
                <TableCell>{maskName(account.userName)}</TableCell>
                <TableCell className="max-w-56 truncate">{maskAddress(account.address)}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {account.meteringPointNumber || account.meteringPointId}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<PlugZapIcon />}
          title="未找到绑定电表账户"
          description="当前会话没有返回绑定的电费户号。"
          action={action}
        />
      )}
    </div>
  )
}
