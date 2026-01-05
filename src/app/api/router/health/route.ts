import { NextResponse } from "next/server"
import { headers } from "next/headers"

const DEFAULT_ROUTER_IP = "192.168.12.1"

export const dynamic = 'force-dynamic'

export async function GET() {
  const headersList = await headers()
  const routerIp = headersList.get("X-Gateway-IP") || DEFAULT_ROUTER_IP

  try {
    // Try to fetch a lightweight endpoint to check connectivity
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(`http://${routerIp}/TMI/v1/version`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return NextResponse.json({ status: "online", ip: routerIp })
    } else {
      return NextResponse.json({ status: "error", ip: routerIp, message: "Gateway returned error" })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isTimeout = errorMessage.includes("abort") || errorMessage.includes("timeout")

    return NextResponse.json({
      status: "offline",
      ip: routerIp,
      message: isTimeout ? "Connection timeout" : errorMessage,
    })
  }
}
