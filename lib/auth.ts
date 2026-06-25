import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { username, jwt } from "better-auth/plugins"
import { AUTH_BASE_PATH } from "@/lib/app-path"
import { getBetterAuthBaseUrl } from "@/lib/auth-url"
import { getDb } from "@/lib/db/client"
import * as schema from "@/lib/db/schema"
import { count } from "drizzle-orm"

export const auth = betterAuth({
  baseURL: getBetterAuthBaseUrl(),
  basePath: AUTH_BASE_PATH,
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
      jwks: schema.authJwks,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    jwt(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const db = getDb()
          const [result] = await db.select({ value: count() }).from(schema.authUsers)
          if (result.value > 0) {
            throw new Error("系统已初始化，禁止注册额外管理员账户")
          }
        }
      }
    }
  }
})
