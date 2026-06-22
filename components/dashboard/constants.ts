import type { ChartConfig } from "@/components/ui/chart"

export const currentDate = new Date()

export const chartConfig = {
  kwh: {
    label: "千瓦时",
    color: "var(--chart-2)",
  },
  charge: {
    label: "电费",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export const qrChannelOptions = [
  { label: "微信", value: "wechat" },
  { label: "支付宝", value: "alipay" },
  { label: "南网 App", value: "app" },
] as const

export type QrChannel = (typeof qrChannelOptions)[number]["value"]
