"use client"

import { useEffect } from "react"
import { useGatewayInfo, useClients, useSimInfo, useApConfig } from "@/hooks/use-router-data"

/**
 * PrefetchData - Preloads commonly accessed data in the background
 * This ensures instant navigation by populating the SWR cache early
 */
export function PrefetchData() {
  // Trigger data fetching for all main pages
  // These hooks will populate the SWR cache
  useGatewayInfo()
  useClients()
  useSimInfo()
  useApConfig()

  // Log prefetch status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Background data prefetch initiated')
    }
  }, [])

  // This component doesn't render anything
  return null
}
