import { withBasePath } from "@/lib/app-path"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBasePath(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const payload = await response.json()
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "请求失败")
  }
  return payload as T
}

export function getMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
