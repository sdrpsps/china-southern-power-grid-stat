import { NextRequest } from "next/server"

import { fail, ok, readJson, toBoolean } from "@/lib/api/http"
import { verifyStoredProfiles } from "@/lib/services/profiles"
import { normalizeProfileSelector } from "@/lib/services/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    return ok(
      await verifyStoredProfiles(
        normalizeProfileSelector({
          profile: params.get("profile") || undefined,
          allProfiles: toBoolean(params.get("allProfiles")),
        })
      )
    )
  } catch (error) {
    return fail(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    return ok(await verifyStoredProfiles(normalizeProfileSelector(await readJson(request))))
  } catch (error) {
    return fail(error)
  }
}
