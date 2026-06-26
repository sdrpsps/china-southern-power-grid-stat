import { ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState, ErrorAlert, LoadingRows } from "@/components/dashboard/components/common"
import type { ApiState, VerifyPayload } from "@/components/dashboard/types"
import type { PublicProfile } from "@/lib/services/types"

function formatDateTime(value?: string) {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

export function VerifyPanel({
  state,
  profiles,
}: {
  state: ApiState<VerifyPayload>
  profiles: PublicProfile[]
}) {
  if (state.loading) return <LoadingRows />
  if (state.error) return <ErrorAlert title="会话验证失败" message={state.error} />
  const rows = state.data?.profiles || profiles.map((profile) => ({
    profile: profile.alias,
    valid: profile.sessionValid === true,
    reason: profile.sessionValid === false ? "上次验证失败" : undefined,
    lastVerifiedAt: profile.lastVerifiedAt || undefined,
  }))
  if (!rows.length) return <EmptyState icon={<ShieldCheckIcon />} title="没有会话状态" description="登录后可以在这里验证会话。" />
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>配置</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>原因</TableHead>
          <TableHead>验证时间</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.profile}>
            <TableCell>{row.profile}</TableCell>
            <TableCell>
              <Badge variant={row.valid ? "secondary" : "destructive"}>
                {row.valid ? "有效" : "无效"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.reason || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(row.lastVerifiedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
