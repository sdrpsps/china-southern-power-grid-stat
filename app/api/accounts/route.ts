import { NextRequest } from "next/server"

import { fail, ok, readJson, toBoolean } from "@/lib/api/http"
import { listAccounts } from "@/lib/services/queries"
import { normalizeProfileSelector } from "@/lib/services/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const selector = normalizeProfileSelector({
      profile: params.get("profile") || undefined,
      allProfiles: toBoolean(params.get("allProfiles")),
    })
    return ok(await listAccounts(selector))
  } catch (error) {
    return fail(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    return ok(await listAccounts(normalizeProfileSelector(await readJson(request))))
  } catch (error) {
    return fail(error)
  }
}
