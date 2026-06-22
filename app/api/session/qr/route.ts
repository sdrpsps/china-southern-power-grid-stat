import { NextRequest } from "next/server"

import { fail, ok, readJson } from "@/lib/api/http"
import { completeQrLogin, createQrLogin } from "@/lib/services/profiles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const qrChannels = new Set(["wechat", "alipay", "app"])

export async function POST(request: NextRequest) {
  try {
    const body = await readJson<{
      action?: "create" | "complete"
      channel?: string
      loginId?: string
      alias?: string
      label?: string | null
      setDefault?: boolean
    }>(request)
    if (body.action === "complete") {
      if (!body.loginId) throw new Error("缺少 loginId。")
      return ok(
        await completeQrLogin({
          alias: body.alias || "",
          label: body.label,
          loginId: body.loginId,
          setDefault: body.setDefault,
        })
      )
    }
    const channel = body.channel || "wechat"
    if (!qrChannels.has(channel)) {
      throw new Error("扫码平台必须是 wechat、alipay 或 app。")
    }
    return ok(await createQrLogin(channel))
  } catch (error) {
    return fail(error)
  }
}
