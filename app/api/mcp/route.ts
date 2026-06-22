import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { getBearerToken, verifyMcpAccessToken } from "@/lib/mcp/auth"
import { createMcpServer } from "@/lib/mcp/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: "Unauthorized: Valid MCP Bearer token required." }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  )
}

async function handleMcpRequest(request: Request) {
  const token = getBearerToken(request.headers.get("Authorization"))
  const payload = token ? await verifyMcpAccessToken(token) : null

  if (!payload) {
    return unauthorizedResponse()
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
