import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * Logout endpoint - client handles clearing localStorage
 * This endpoint exists for compatibility but doesn't need to do anything server-side
 */
export async function POST() {
  return NextResponse.json({ success: true })
}
