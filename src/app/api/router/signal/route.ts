import { NextResponse } from "next/server"
import { getSignalInfo } from "@/lib/router-api"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getSignalInfo()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Signal API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch signal info" },
      { status: 500 }
    )
  }
}
