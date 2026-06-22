import { NextRequest } from "next/server"
import { z } from "zod"

import { fail, ok, readJson } from "@/lib/api/http"
import { queryUsage } from "@/lib/services/queries"
import { accountSelectionSchema, getAccountNumbers, normalizeProfileSelector } from "@/lib/services/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const usageSchema = accountSelectionSchema.extend({
  year: z.coerce.number().int(),
  month: z.coerce.number().int(),
})

export async function POST(request: NextRequest) {
  try {
    const body = usageSchema.parse(await readJson(request))
    return ok(
      await queryUsage({
        selector: normalizeProfileSelector(body),
        accountNumbers: getAccountNumbers(body),
        allAccounts: body.allAccounts === true,
        year: body.year,
        month: body.month,
      })
    )
  } catch (error) {
    return fail(error)
  }
}
