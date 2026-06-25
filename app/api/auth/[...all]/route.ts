import { auth } from "@/lib/auth"
import { normalizeAuthRequestBasePath } from "@/lib/auth-request"

function handler(request: Request) {
  return auth.handler(normalizeAuthRequestBasePath(request))
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
