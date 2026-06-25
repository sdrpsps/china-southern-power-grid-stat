import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { APP_BASE_PATH, stripBasePath, withBasePath } from "@/lib/app-path";

export async function proxy(request: NextRequest) {
  const pathname = stripBasePath(request.nextUrl.pathname, request.nextUrl.basePath || APP_BASE_PATH);

  // 1. 必须排除静态文件、认证核心路由、登录页以及 MCP 端点
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/api/mcp" // 予以放行，由其路由内部提供规范的 API 401 响应
  ) {
    return NextResponse.next();
  }

  // 2. 拦截并保护其他路由
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL(withBasePath("/login"), request.url));
  }

  return NextResponse.next();
}
