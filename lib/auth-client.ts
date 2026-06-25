import { createAuthClient } from "better-auth/react"
import { usernameClient, jwtClient } from "better-auth/client/plugins"
import { AUTH_BASE_PATH } from "@/lib/app-path"

export const authClient = createAuthClient({
  basePath: AUTH_BASE_PATH,
  plugins: [
    usernameClient(),
    jwtClient(),
  ],
})
