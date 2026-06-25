import { AUTH_ROUTE_PATH } from "@/lib/app-path"

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "")
}

function normalizePathname(value: string) {
  const trimmed = trimTrailingSlashes(value)
  return trimmed === "" ? "/" : trimmed
}

export function getBetterAuthBaseUrl() {
  const configured = process.env.BETTER_AUTH_URL?.trim()
  if (!configured) return undefined

  const url = new URL(configured)
  const pathname = normalizePathname(url.pathname)

  if (pathname.endsWith(AUTH_ROUTE_PATH)) {
    return trimTrailingSlashes(url.toString())
  }

  url.pathname = pathname === "/" ? AUTH_ROUTE_PATH : `${pathname}${AUTH_ROUTE_PATH}`
  return trimTrailingSlashes(url.toString())
}
