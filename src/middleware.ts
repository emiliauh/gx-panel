import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Simplified middleware for client-side auth
 * 
 * Since auth is now stored in localStorage (client-side), we can't check it in middleware
 * The client-side hooks handle authentication and redirect to login if needed
 * 
 * This middleware just ensures API routes have the required headers
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // For authenticated API routes, check if headers are present
  const protectedApiRoutes = [
    "/api/router/clients",
    "/api/router/cell",
    "/api/router/sim",
    "/api/router/ap",
    "/api/router/telemetry",
    "/api/router/reboot",
  ]

  if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.headers.get("X-Auth-Token")
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/router/:path*",
  ],
}
