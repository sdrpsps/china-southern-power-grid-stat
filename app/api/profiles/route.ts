import { NextRequest } from "next/server"

import { fail, ok, readJson } from "@/lib/api/http"
import { getProfiles, chooseDefaultProfile } from "@/lib/services/profiles"
import { validateProfileAlias } from "@/lib/services/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return ok(await getProfiles())
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await readJson<{ alias?: string }>(request)
    return ok(await chooseDefaultProfile(validateProfileAlias(body.alias || "")))
  } catch (error) {
    return fail(error)
  }
}
