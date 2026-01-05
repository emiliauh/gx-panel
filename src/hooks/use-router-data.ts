"use client"

import useSWR from "swr"
import { getAuthHeaders, clearAuthConfig } from "@/lib/client-auth"

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false

async function handleUnauthorized() {
  if (isRedirecting) return
  isRedirecting = true

  // Clear localStorage
  clearAuthConfig()

  // Small delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 100))

  // Use replace to prevent back button issues
  window.location.replace("/login")
}

const fetcher = async (url: string) => {
  // Don't fetch if we're already redirecting
  if (isRedirecting) {
    return new Promise(() => {})
  }

  // Get auth headers from localStorage
  const authHeaders = getAuthHeaders()

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      ...authHeaders,
    },
  })

  // Check for 401 status before parsing JSON
  if (res.status === 401) {
    handleUnauthorized()
    return new Promise(() => {})
  }

  const data = await res.json()

  // Also check for auth error in response body
  if (data.error === "Not authenticated") {
    handleUnauthorized()
    return new Promise(() => {})
  }

  return data
}

export interface GatewayHealthStatus {
  status: "online" | "offline" | "error"
  ip: string
  message?: string
}

export function useGatewayHealth() {
  return useSWR<GatewayHealthStatus>("/api/router/health", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useGatewayInfo() {
  return useSWR("/api/router/gateway", fetcher, {
    refreshInterval: 5000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useSignalInfo() {
  return useSWR("/api/router/signal", fetcher, {
    refreshInterval: 3000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useCellInfo() {
  return useSWR("/api/router/cell", fetcher, {
    refreshInterval: 5000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useClients() {
  return useSWR("/api/router/clients", fetcher, {
    refreshInterval: 10000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useSimInfo() {
  return useSWR("/api/router/sim", fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export function useApConfig() {
  return useSWR("/api/router/ap", fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}

export interface VersionInfo {
  version: number
}

export function useVersion() {
  return useSWR<VersionInfo>("/api/router/version", fetcher, {
    refreshInterval: 60000, // Check every minute
  })
}

export interface TelemetryAll {
  cell: {
    "5g": {
      cqi: number
      ecgi: string
      sector: {
        antennaUsed: string
        bands: string[]
        bars: number
        cid: number
        gNBID: number
        rsrp: number
        rsrq: number
        rssi: number
        sinr: number
      }
    }
    generic: {
      apn: string
      hasIPv6: boolean
      registration: string
    }
    gps: {
      latitude: number
      longitude: number
    }
  }
  clients: {
    "2.4ghz": Array<{
      connected: boolean
      ipv4: string
      ipv6: string[]
      mac: string
      name: string
      signal?: number
    }>
    "5.0ghz": Array<{
      connected: boolean
      ipv4: string
      ipv6: string[]
      mac: string
      name: string
      signal?: number
    }>
    ethernet: Array<{
      connected: boolean
      ipv4: string
      ipv6: string[]
      mac: string
      name: string
    }>
    wifi: Array<{
      connected: boolean
      ipv4: string
      ipv6: string[]
      mac: string
      name: string
      signal?: number
    }>
  }
  sim: {
    iccId: string
    imei: string
    imsi: string
    msisdn: string
    status: boolean
  }
}

// Combined telemetry hook - fetches cell, clients, and sim in one call
export function useTelemetryAll() {
  return useSWR<TelemetryAll>("/api/router/telemetry", fetcher, {
    refreshInterval: 5000,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}
