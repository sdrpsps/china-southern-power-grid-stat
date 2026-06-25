const rawBasePath = process.env.APP_BASE_PATH ?? ""

export function normalizeBasePath(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return ""
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return prefixed.replace(/\/+$/, "")
}

export const APP_BASE_PATH = normalizeBasePath(rawBasePath)

export const AUTH_ROUTE_PATH = "/api/auth"

export const AUTH_BASE_PATH = APP_BASE_PATH ? `${APP_BASE_PATH}${AUTH_ROUTE_PATH}` : AUTH_ROUTE_PATH

export function withBasePath(path: string, basePath = APP_BASE_PATH) {
  if (!path.startsWith("/")) return path

  const normalizedBasePath = normalizeBasePath(basePath)
  const normalized = normalizedBasePath ? `${normalizedBasePath}${path}` : path
  return normalized
}

export function stripBasePath(pathname: string, basePath = APP_BASE_PATH) {
  const normalizedBasePath = normalizeBasePath(basePath)
  if (!normalizedBasePath) return pathname
  if (pathname === normalizedBasePath) return "/"
  if (pathname.startsWith(`${normalizedBasePath}/`)) {
    return pathname.slice(normalizedBasePath.length)
  }
  return pathname
}
