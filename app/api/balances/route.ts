import { NextRequest } from "next/server"

import { fail, ok, readJson } from "@/lib/api/http"
import { queryBalances } from "@/lib/services/queries"
import { accountSelectionSchema, getAccountNumbers, normalizeProfileSelector } from "@/lib/services/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = accountSelectionSchema.parse(await readJson(request))
    return ok(
      await queryBalances({
        selector: normalizeProfileSelector(body),
        accountNumbers: getAccountNumbers(body),
        allAccounts: body.allAccounts === true,
      })
    )
  } catch (error) {
    return fail(error)
  }
}
