import { createAuthClient } from "better-auth/react"
import { usernameClient, jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    jwtClient(),
  ],
})
