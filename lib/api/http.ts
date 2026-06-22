import { NextResponse } from "next/server"

import { sanitizeErrorMessage } from "@/lib/services/privacy"

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}

export function ok(data: unknown) {
  return NextResponse.json({ ok: true, ...toObject(data) })
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json(
    { ok: false, error: sanitizeErrorMessage(message) },
    { status }
  )
}

export function toBoolean(value: string | null) {
  return value === "1" || value === "true"
}

function toObject(data: unknown) {
  if (data && typeof data === "object" && !Array.isArray(data)) return data
  return { data }
}
