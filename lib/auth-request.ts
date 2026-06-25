import { APP_BASE_PATH, AUTH_BASE_PATH, AUTH_ROUTE_PATH } from "@/lib/app-path"

function isPathOrChild(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

export function normalizeAuthRequestBasePath(request: Request) {
  if (!APP_BASE_PATH) return request

  const url = new URL(request.url)
  if (isPathOrChild(url.pathname, AUTH_BASE_PATH)) return request
  if (!isPathOrChild(url.pathname, AUTH_ROUTE_PATH)) return request

  url.pathname = `${APP_BASE_PATH}${url.pathname}`
  return new Request(url, request)
}
