import { getDb } from "@/lib/db/client"
import { authUsers } from "@/lib/db/schema"
import { count } from "drizzle-orm"
import { LoginPageClient } from "./login-client"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const db = getDb()
  const [result] = await db.select({ value: count() }).from(authUsers)
  const hasUsers = result.value > 0

  return <LoginPageClient hasUsers={hasUsers} />
}
