import { auth } from "@/lib/auth"
import { issueMcpAccessToken } from "@/lib/mcp/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    )
  }

  return Response.json(await issueMcpAccessToken(session.user.id))
}
