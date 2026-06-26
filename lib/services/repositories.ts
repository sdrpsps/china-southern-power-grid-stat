import { desc, eq } from "drizzle-orm"

import { getDb } from "@/lib/db/client"
import {
  operationLogs,
  profiles,
  sessions,
  type ProfileRow,
  type SessionRow,
} from "@/lib/db/schema"
import type { PublicProfile } from "@/lib/services/types"
import { maskAccountNumber, sanitizeErrorMessage } from "@/lib/services/privacy"

function now() {
  return new Date().toISOString()
}

export async function listPublicProfiles(): Promise<PublicProfile[]> {
  const db = getDb()
  const rows = db
    .select({ profile: profiles, session: sessions })
    .from(profiles)
    .leftJoin(sessions, eq(sessions.profileId, profiles.id))
    .orderBy(desc(profiles.isDefault), profiles.alias)
    .all()

  return rows.map(({ profile, session }) => ({
    id: profile.id,
    alias: profile.alias,
    label: profile.label,
    isDefault: profile.isDefault,
    hasSession: Boolean(session?.authToken),
    sessionValid: session?.valid ?? null,
    lastVerifiedAt: session?.lastVerifiedAt ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }))
}

export async function getProfileByAlias(alias: string): Promise<ProfileRow | null> {
  return getDb().select().from(profiles).where(eq(profiles.alias, alias)).get() ?? null
}

export async function getDefaultProfile(): Promise<ProfileRow | null> {
  return getDb().select().from(profiles).where(eq(profiles.isDefault, true)).get() ?? null
}

export async function upsertProfile(input: {
  alias: string
  label?: string | null
  setDefault?: boolean
}) {
  const db = getDb()
  const timestamp = now()
  const existing = await getProfileByAlias(input.alias)
  if (input.setDefault) {
    db.update(profiles).set({ isDefault: false }).run()
  }
  if (existing) {
    db.update(profiles)
      .set({
        label: input.label ?? existing.label,
        isDefault: input.setDefault ? true : existing.isDefault,
        updatedAt: timestamp,
      })
      .where(eq(profiles.id, existing.id))
      .run()
    return (await getProfileByAlias(input.alias))!
  }

  const hasAny = db.select().from(profiles).limit(1).get()
  db.insert(profiles)
    .values({
      alias: input.alias,
      label: input.label ?? null,
      isDefault: input.setDefault === true || !hasAny,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run()
  return (await getProfileByAlias(input.alias))!
}

export async function setDefaultProfile(alias: string) {
  const profile = await getProfileByAlias(alias)
  if (!profile) {
    throw new Error(`未知用户配置 '${alias}'。`)
  }
  const db = getDb()
  db.transaction(() => {
    db.update(profiles).set({ isDefault: false }).run()
    db.update(profiles).set({ isDefault: true, updatedAt: now() }).where(eq(profiles.id, profile.id)).run()
  })
}

export async function deleteProfile(alias: string) {
  const profile = await getProfileByAlias(alias)
  if (!profile) {
    throw new Error(`未知用户配置 '${alias}'。`)
  }
  // 关联的 sessions、electricity_accounts、balance_snapshots、usage_months 均设置了 onDelete: "cascade"，
  // 删除 profile 后会自动级联删除。
  getDb().delete(profiles).where(eq(profiles.id, profile.id)).run()
}

export async function saveSession(input: {
  profileId: number
  authToken: string
  valid?: boolean
  lastVerifiedAt?: string | null
}) {
  const db = getDb()
  const existing = db.select().from(sessions).where(eq(sessions.profileId, input.profileId)).get()
  const timestamp = now()
  if (existing) {
    db.update(sessions)
      .set({
        authToken: input.authToken,
        valid: input.valid ?? existing.valid,
        lastVerifiedAt: input.lastVerifiedAt ?? existing.lastVerifiedAt,
        updatedAt: timestamp,
      })
      .where(eq(sessions.id, existing.id))
      .run()
    return
  }
  db.insert(sessions)
    .values({
      profileId: input.profileId,
      authToken: input.authToken,
      valid: input.valid ?? null,
      lastVerifiedAt: input.lastVerifiedAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run()
}

export async function updateSessionValidity(profileId: number, valid: boolean) {
  const timestamp = now()
  getDb()
    .update(sessions)
    .set({ valid, lastVerifiedAt: timestamp, updatedAt: timestamp })
    .where(eq(sessions.profileId, profileId))
    .run()
  return timestamp
}

export async function getSessionForProfile(profileId: number): Promise<SessionRow | null> {
  return getDb().select().from(sessions).where(eq(sessions.profileId, profileId)).get() ?? null
}

export async function listProfilesWithSessions() {
  return getDb()
    .select({ profile: profiles, session: sessions })
    .from(profiles)
    .leftJoin(sessions, eq(sessions.profileId, profiles.id))
    .orderBy(desc(profiles.isDefault), profiles.alias)
    .all()
}

export async function logOperation(input: {
  operation: string
  profileAlias?: string
  accountNumber?: string
  status: "success" | "failure"
  summary?: string
  error?: string
}) {
  getDb()
    .insert(operationLogs)
    .values({
      operation: input.operation,
      profileAlias: input.profileAlias,
      accountNumber: input.accountNumber ? maskAccountNumber(input.accountNumber) : undefined,
      status: input.status,
      summary: input.summary,
      error: input.error ? sanitizeErrorMessage(input.error) : undefined,
      createdAt: now(),
    })
    .run()
}
