import { NextResponse } from "next/server"
import { getVersion } from "@/lib/router-api"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getVersion()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Version API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch version info" },
      { status: 500 }
    )
  }
}
