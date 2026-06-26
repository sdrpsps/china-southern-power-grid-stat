import { GaugeIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState, ErrorAlert, ErrorsList, LoadingRows, Metric } from "@/components/dashboard/components/common"
import { chartConfig } from "@/components/dashboard/constants"
import type { ApiState, UsagePayload } from "@/components/dashboard/types"
import { maskAccountNumber } from "@/lib/services/privacy"

export function UsagePanel({ state }: { state: ApiState<UsagePayload> }) {
  if (state.loading) return <LoadingRows />
  if (state.error) return <ErrorAlert title="用量查询失败" message={state.error} />
  if (!state.data) return <EmptyState icon={<GaugeIcon />} title="尚未查询用量" description="选择年份、月份和电费户号后查询月度用量。" />
  const firstUsage = state.data.usages[0]
  return (
    <div className="flex flex-col gap-5">
      <ErrorsList errors={state.data.errors} />
      {firstUsage ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="月电费" value={firstUsage.monthTotalCost == null ? "未返回" : `¥${firstUsage.monthTotalCost.toFixed(2)}`} />
            <Metric label="月电量" value={firstUsage.monthTotalKwh == null ? "未返回" : `${firstUsage.monthTotalKwh.toFixed(2)} kWh`} />
            <Metric label="阶梯" value={firstUsage.ladder.ladder == null ? "未返回" : `第 ${firstUsage.ladder.ladder} 阶`} />
            <Metric label="当前电价" value={firstUsage.ladder.tariff == null ? "未返回" : `¥${firstUsage.ladder.tariff.toFixed(4)}`} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">每日趋势</CardTitle>
              <CardDescription>
                {maskAccountNumber(firstUsage.accountNumber)} · {firstUsage.year}-{String(firstUsage.month).padStart(2, "0")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart accessibilityLayer data={firstUsage.dailyDetails}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => String(value).slice(-2)}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar dataKey="kwh" fill="var(--color-kwh)" radius={4} />
                  <Bar dataKey="charge" fill="var(--color-charge)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>电量</TableHead>
                <TableHead>电费</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {firstUsage.dailyDetails.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>{day.date}</TableCell>
                  <TableCell>{day.kwh.toFixed(2)} kWh</TableCell>
                  <TableCell>{day.charge === 0 ? "未返回或为 0" : `¥${day.charge.toFixed(2)}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <EmptyState icon={<GaugeIcon />} title="没有用量记录" description="上游没有返回该月份的用量数据。" />
      )}
    </div>
  )
}
