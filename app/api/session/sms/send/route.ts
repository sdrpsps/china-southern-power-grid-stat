import { NextRequest } from "next/server"

import { fail, ok, readJson } from "@/lib/api/http"
import { sendLoginSms } from "@/lib/services/profiles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await readJson<{ phoneNo?: string }>(request)
    if (!body.phoneNo) throw new Error("手机号不能为空。")
    return ok(await sendLoginSms(body.phoneNo))
  } catch (error) {
    return fail(error)
  }
}
