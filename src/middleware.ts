import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware for client-side auth and CSRF protection
 *
 * Since auth is now stored in localStorage (client-side), we can't check it in middleware
 * The client-side hooks handle authentication and redirect to login if needed
 *
 * This middleware:
 * 1. Ensures API routes have required authentication headers
 * 2. Validates Origin/Referer headers to prevent CSRF attacks
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CSRF Protection: Verify Origin/Referer for state-changing requests
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)

  if (isStateChanging) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // Allow same-origin requests
    const isValidOrigin = origin && new URL(origin).host === host
    const isValidReferer = referer && new URL(referer).host === host

    if (!isValidOrigin && !isValidReferer) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }

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
