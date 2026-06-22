import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createMcpServer } from "@/lib/mcp/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handleMcpRequest(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid or missing JWT token in Authorization header." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}

export async function GET(request: Request) {
  return handleMcpRequest(request)
}

export async function POST(request: Request) {
  return handleMcpRequest(request)
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request)
}
