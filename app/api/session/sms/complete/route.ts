import { NextRequest } from "next/server"

import { fail, ok, readJson } from "@/lib/api/http"
import { completeSmsLogin } from "@/lib/services/profiles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await readJson<{
      alias?: string
      label?: string | null
      phoneNo?: string
      smsCode?: string
      password?: string
      setDefault?: boolean
    }>(request)
    if (!body.phoneNo) throw new Error("手机号不能为空。")
    if (!body.smsCode) throw new Error("短信验证码不能为空。")
    return ok(
      await completeSmsLogin({
        alias: body.alias || "",
        label: body.label,
        phoneNo: body.phoneNo,
        smsCode: body.smsCode,
        password: body.password,
        setDefault: body.setDefault,
      })
    )
  } catch (error) {
    return fail(error)
  }
}
