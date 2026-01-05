import { NextResponse } from "next/server"

const DEFAULT_ROUTER_IP = "192.168.12.1"

export const dynamic = 'force-dynamic'

/**
 * Login endpoint - authenticates with gateway and returns token to client
 * Client stores token in localStorage and passes it with subsequent requests
 */
export async function POST(request: Request) {
  try {
    const { username, password, routerIp } = await request.json()
    const ip = routerIp || DEFAULT_ROUTER_IP

    const response = await fetch(`http://${ip}/TMI/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.auth?.token) {
      // Return token to client for localStorage storage
      return NextResponse.json({
        success: true,
        token: data.auth.token,
        expiration: data.auth.expiration,
        routerIp: ip,
        username,
      })
    } else {
      return NextResponse.json(
        { success: false, error: data.result?.message || "Invalid credentials" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, error: "Connection failed. Is the gateway reachable?" },
      { status: 500 }
    )
  }
}
