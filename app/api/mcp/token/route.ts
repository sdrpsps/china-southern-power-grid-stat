import { and, desc, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { mcpTokens } from "@/lib/db/schema"
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

  const db = getDb()
  const tokens = db
    .select({
      id: mcpTokens.id,
      name: mcpTokens.name,
      expiresAt: mcpTokens.expiresAt,
      createdAt: mcpTokens.createdAt,
    })
    .from(mcpTokens)
    .where(eq(mcpTokens.userId, session.user.id))
    .orderBy(desc(mcpTokens.createdAt))
    .all()

  return Response.json({ tokens })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    )
  }

  let body: { name?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Ignore and use default
  }

  const name = body.name?.trim() || "Default Agent"
  const tokenData = await issueMcpAccessToken(session.user.id, name)
  return Response.json(tokenData)
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized: Active administrator session required." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const idStr = searchParams.get("id")
  if (!idStr) {
    return Response.json({ error: "Missing token id parameter." }, { status: 400 })
  }

  const id = Number(idStr)
  if (isNaN(id)) {
    return Response.json({ error: "Invalid token id parameter." }, { status: 400 })
  }

  const db = getDb()
  db.delete(mcpTokens)
    .where(and(eq(mcpTokens.id, id), eq(mcpTokens.userId, session.user.id)))
    .run()

  return Response.json({ success: true })
}
